const { Airport, Schedule, Flight, Airline } = require('../models');
const { buildFlightGraph } = require('../utils/graphTraversal');
const { AirportLocation } = require('../config/mongodb');
const crypto = require('crypto');
const redis = require('../config/redis');
const { Op } = require('sequelize');
const axios = require('axios');

const SEAT_SERVICE_URL = process.env.SEAT_SERVICE_URL || 'http://localhost:4004';
const PRICING_SERVICE_URL = process.env.PRICING_SERVICE_URL || 'http://localhost:4006';

const generateQueryHash = (query) => {
  return crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');
};

const applyFilter = (flights) => {
  const now = new Date();
  
  return flights.filter(r => {
    const depTime = new Date(r.departureTime);
    const arrTime = new Date(r.arrivalTime);
    
    // ULTRA-STRICT: If the flight has already departed OR already arrived, HIDE IT.
    // You cannot book a flight that is already in progress or completed.
    if (depTime <= now) return false;
    if (arrTime <= now) return false;
    
    return true;
  });
};

const searchFlights = async (searchParams) => {
  const { source, destination, date, passengers = 1, stops = 3, sortBy = 'price', travelClass = 'ECONOMY' } = searchParams;
  const cacheKey = generateQueryHash(searchParams);
  const cachedResult = await redis.get(`search:v5:${cacheKey}`);
  
  if (cachedResult) {
    const parsedCache = JSON.parse(cachedResult);
    return applyFilter(parsedCache);
  }

  const sourceAirport = await Airport.findOne({
    where: {
      [Op.or]: [
        { code: source.toUpperCase() },
        { city: { [Op.like]: `%${source}%` } },
        { name: { [Op.like]: `%${source}%` } }
      ]
    }
  });
  const destAirport = await Airport.findOne({
    where: {
      [Op.or]: [
        { code: destination.toUpperCase() },
        { city: { [Op.like]: `%${destination}%` } },
        { name: { [Op.like]: `%${destination}%` } }
      ]
    }
  });
  if (!sourceAirport || !destAirport) throw new Error('Invalid airport codes');

  const flightGraph = await buildFlightGraph(new Date(date));
  let itineraries = flightGraph.findConnectingFlights(sourceAirport.airport_id, destAirport.airport_id, stops, new Date(date));

  // Filter by seat availability via seat-service
  if (itineraries.length > 0) {
    const uniqueScheduleIds = [...new Set(itineraries.flatMap(it => it.path.map(p => p.schedule.schedule_id)))];
    try {
      const response = await axios.post(`${SEAT_SERVICE_URL}/internal/availability-count`, {
        scheduleIds: uniqueScheduleIds,
        travelClass: travelClass.toUpperCase()
      });
      const scheduleAvailability = response.data.availability || {};
      itineraries = itineraries.filter(it =>
        it.path.every(p => (scheduleAvailability[p.schedule.schedule_id] || 0) >= passengers)
      );
    } catch (err) {
      console.warn('[flight-service] Could not check seat availability:', err.message);
    }
  }

  // Filter sub-optimal layovers
  if (itineraries.length > 0) {
    const optimalMap = new Map();
    for (const it of itineraries) {
      const routeParam = [sourceAirport.airport_id];
      it.path.forEach(p => routeParam.push(p.schedule.dest_airport_id));
      const groupKey = `${it.path[0].schedule.schedule_id}-${routeParam.join('-')}`;
      if (!optimalMap.has(groupKey)) {
        optimalMap.set(groupKey, it);
      } else {
        const existing = optimalMap.get(groupKey);
        if (it.totalDuration < existing.totalDuration || (it.totalDuration === existing.totalDuration && it.totalPrice < existing.totalPrice)) {
          optimalMap.set(groupKey, it);
        }
      }
    }
    itineraries = Array.from(optimalMap.values());
  }

  // Get class multiplier from pricing-service
  let classMultiplier = 1.0;
  try {
    const priceResp = await axios.get(`${PRICING_SERVICE_URL}/class-multiplier/${travelClass}`);
    classMultiplier = priceResp.data.multiplier;
  } catch (err) {
    classMultiplier = travelClass.toUpperCase() === 'FIRST' ? 4.0 : travelClass.toUpperCase() === 'BUSINESS' ? 2.5 : 1.0;
  }

  let results = itineraries.map(itinerary => ({
    id: crypto.randomUUID(),
    itineraryId: crypto.randomUUID(),
    type: itinerary.stops === 0 ? 'DIRECT' : 'CONNECTING',
    segments: itinerary.path.map(p => p.schedule),
    totalPrice: itinerary.totalPrice * classMultiplier,
    total_base_price: itinerary.totalPrice * classMultiplier,
    total_duration_minutes: itinerary.totalDuration,
    stops: itinerary.stops,
    airlines: [...new Set(itinerary.path.map(p => p.schedule.Flight?.Airline?.name || 'AeroFlow'))],
    airlineLogo: itinerary.path[0]?.schedule?.Flight?.Airline?.logo_url || null,
    departureTime: itinerary.path[0].departure,
    arrivalTime: itinerary.path[itinerary.path.length - 1].arrival,
    layovers: itinerary.layovers.map(l => ({
      waitTime: l.minutes,
      to: itinerary.path.find(p => p.schedule.source_airport_id === l.airport)?.schedule?.SourceAirport?.code || ''
    })),
    sourceAirport: sourceAirport.code,
    destAirport: destAirport.code
  }));

  results = flightGraph.rankResults(results, sortBy);

  // Apply strict filtering
  const filteredResults = applyFilter(results);

  // Cache strictly filtered results for 60 seconds
  await redis.setex(`search:v5:${cacheKey}`, 60, JSON.stringify(filteredResults));

  return filteredResults;
};

const searchNearbyAirports = async (lat, lng, radiusKm = 150) => {
  return await AirportLocation.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000
      }
    }
  });
};

const getAirportByCode = async (code) => {
  return await Airport.findOne({ where: { code: code.toUpperCase() } });
};

const searchAirports = async (q) => {
  if (Array.isArray(q)) q = q[0];
  if (!q || typeof q !== 'string' || q.trim() === '') return [];
  return await Airport.findAll({
    where: {
      [Op.or]: [
        { code: { [Op.like]: `%${q}%` } },
        { name: { [Op.like]: `%${q}%` } },
        { city: { [Op.like]: `%${q}%` } }
      ]
    },
    limit: 10
  });
};

const getAvailableFilters = async (source, destination, date) => {
  const sourceAirport = await Airport.findOne({
    where: { [Op.or]: [{ code: source.toUpperCase() }, { city: { [Op.like]: `%${source}%` } }, { name: { [Op.like]: `%${source}%` } }] }
  });
  const destAirport = await Airport.findOne({
    where: { [Op.or]: [{ code: destination.toUpperCase() }, { city: { [Op.like]: `%${destination}%` } }, { name: { [Op.like]: `%${destination}%` } }] }
  });
  if (!sourceAirport || !destAirport) throw new Error('Airport not found');

  const flightGraph = await buildFlightGraph(new Date(date));
  let itineraries = flightGraph.findConnectingFlights(sourceAirport.airport_id, destAirport.airport_id, 3, new Date(date));

  // Filter out past flights to keep filters consistent with visible results
  const now = new Date();
  const arrivalCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  itineraries = itineraries.filter(it => new Date(it.path[it.path.length - 1].arrival) >= arrivalCutoff);

  if (itineraries.length === 0) {
    return { airlines: [], priceRange: { min: 0, max: 0 }, timeRanges: { earliest: 0, latest: 0 } };
  }

  const airlineSet = new Set();
  const prices = [];
  const hours = [];

  itineraries.forEach(it => {
    it.path.forEach(p => {
      const airline = p.schedule.Flight?.Airline;
      if (airline) {
        airlineSet.add(JSON.stringify({ airline_id: airline.airline_id, name: airline.name }));
      }
    });
    prices.push(it.totalPrice);
    hours.push(new Date(it.path[0].departure).getHours());
  });

  const airlines = Array.from(airlineSet).map(str => JSON.parse(str));

  return {
    airlines,
    priceRange: { 
      min: Math.floor(Math.min(...prices)), 
      max: Math.ceil(Math.max(...prices)) 
    },
    timeRanges: { 
      earliest: Math.min(...hours), 
      latest: Math.max(...hours) 
    }
  };
};

const getDatePrices = async (source, destination, startDate, endDate) => {
  const sourceAirport = await Airport.findOne({ where: { [Op.or]: [{ code: source.toUpperCase() }, { city: { [Op.like]: `%${source}%` } }] } });
  const destAirport = await Airport.findOne({ where: { [Op.or]: [{ code: destination.toUpperCase() }, { city: { [Op.like]: `%${destination}%` } }] } });
  if (!sourceAirport || !destAirport) return {};

  const schedules = await Schedule.findAll({
    where: {
      source_airport_id: sourceAirport.airport_id,
      dest_airport_id: destAirport.airport_id,
      departure_time: { [Op.between]: [new Date(startDate), new Date(endDate)] }
    },
    attributes: ['departure_time', 'base_price']
  });

  const pricesByDate = {};
  schedules.forEach(s => {
    const dateKey = new Date(s.departure_time).toISOString().split('T')[0];
    const price = parseFloat(s.base_price);
    if (!pricesByDate[dateKey] || price < pricesByDate[dateKey]) pricesByDate[dateKey] = price;
  });
  return pricesByDate;
};

// Admin CRUD operations
const createAirline = async (data) => await Airline.create(data);
const updateAirline = async (id, data) => { const airline = await Airline.findByPk(id); if (!airline) throw new Error('Airline not found'); await airline.update(data); return airline; };
const deleteAirline = async (id) => { const airline = await Airline.findByPk(id); if (!airline) throw new Error('Airline not found'); await airline.destroy(); return true; };
const getAllAirlines = async () => await Airline.findAll();
const updateAirlineLogo = async (id, logoUrl) => { const airline = await Airline.findByPk(id); if (!airline) throw new Error('Airline not found'); await airline.update({ logo_url: logoUrl }); return airline; };

const createAirport = async (data) => {
  const airport = await Airport.create(data);
  await AirportLocation.create({
    airportId: airport.airport_id, name: airport.name, code: airport.code,
    city: airport.city, country: airport.country,
    location: { type: 'Point', coordinates: [parseFloat(airport.longitude), parseFloat(airport.latitude)] }
  });
  return airport;
};
const updateAirport = async (id, data) => {
  const airport = await Airport.findByPk(id); if (!airport) throw new Error('Airport not found');
  await airport.update(data);
  await AirportLocation.findOneAndUpdate({ airportId: id },
    { name: airport.name, code: airport.code, city: airport.city, country: airport.country, location: { type: 'Point', coordinates: [parseFloat(airport.longitude), parseFloat(airport.latitude)] } },
    { upsert: true });
  return airport;
};
const deleteAirport = async (id) => { const airport = await Airport.findByPk(id); if (!airport) throw new Error('Airport not found'); await airport.destroy(); await AirportLocation.deleteOne({ airportId: id }); return true; };
const getAllAirports = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const where = {};
  if (search) { where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }, { city: { [Op.like]: `%${search}%` } }]; }
  const { count, rows } = await Airport.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
  return { data: rows, total: count, page, totalPages: Math.ceil(count / limit) };
};

const createFlight = async (data) => await Flight.create(data);
const updateFlight = async (id, data) => { const flight = await Flight.findByPk(id); if (!flight) throw new Error('Flight not found'); await flight.update(data); return flight; };
const deleteFlight = async (id) => { const flight = await Flight.findByPk(id); if (!flight) throw new Error('Flight not found'); await flight.destroy(); return true; };
const getAllFlights = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const where = search ? { flight_no: { [Op.like]: `%${search}%` } } : {};
  const { count, rows } = await Flight.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']], include: [Airline] });
  return { data: rows, total: count, page, totalPages: Math.ceil(count / limit) };
};

const createSchedule = async (data) => {
  const flightId = parseInt(data.flight_id);
  const flight = await Flight.findByPk(flightId);
  if (!flight) throw new Error('Flight not found');
  let durationMinutes = data.duration_minutes;
  if (!durationMinutes && data.departure_time && data.arrival_time) {
    durationMinutes = Math.round((new Date(data.arrival_time) - new Date(data.departure_time)) / (1000 * 60));
  }
  const schedule = await Schedule.create({
    ...data, flight_id: flightId, source_airport_id: parseInt(data.source_airport_id),
    dest_airport_id: parseInt(data.dest_airport_id), base_price: parseFloat(data.base_price),
    duration_minutes: durationMinutes || 0, available_seats: data.available_seats || flight.seat_capacity, status: data.status || 'SCHEDULED'
  });
  // Notify seat-service to create FlightSeat records
  try {
    await axios.post(`${SEAT_SERVICE_URL}/internal/create-flight-seats`, {
      scheduleId: schedule.schedule_id, basePrice: schedule.base_price
    });
  } catch (err) { console.warn('[flight-service] Could not create flight seats:', err.message); }
  return schedule;
};
const updateSchedule = async (id, data) => {
  const schedule = await Schedule.findByPk(id); if (!schedule) throw new Error('Schedule not found');
  const updateData = { ...data };
  if (data.flight_id) updateData.flight_id = parseInt(data.flight_id);
  if (data.base_price) updateData.base_price = parseFloat(data.base_price);
  if ((data.departure_time || data.arrival_time) && !data.duration_minutes) {
    updateData.duration_minutes = Math.round((new Date(data.arrival_time || schedule.arrival_time) - new Date(data.departure_time || schedule.departure_time)) / (1000 * 60));
  }
  await schedule.update(updateData);
  return schedule;
};
const deleteSchedule = async (id) => {
  const schedule = await Schedule.findByPk(id); if (!schedule) throw new Error('Schedule not found');
  try { await axios.delete(`${SEAT_SERVICE_URL}/internal/flight-seats/${id}`); } catch (err) {}
  await schedule.destroy();
  return true;
};
const getAllSchedules = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const include = [
    { model: Flight, include: [Airline], where: search ? { flight_no: { [Op.like]: `%${search}%` } } : undefined },
    { model: Airport, as: 'SourceAirport' }, { model: Airport, as: 'DestAirport' }
  ];
  const { count, rows } = await Schedule.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']], include, distinct: true });
  return { data: rows, total: count, page, totalPages: Math.ceil(count / limit) };
};

const updateFlightStatus = async (scheduleId, status, delayMinutes = 0) => {
  const schedule = await Schedule.findByPk(scheduleId, { include: [{ model: Flight, include: [Airline] }] });
  if (!schedule) throw new Error('Schedule not found');
  await schedule.update({ status });
  return schedule;
};

// Internal endpoint: get schedule by ID
const getScheduleById = async (scheduleId) => {
  return await Schedule.findByPk(scheduleId, {
    include: [{ model: Flight, include: [Airline] }, { model: Airport, as: 'SourceAirport' }, { model: Airport, as: 'DestAirport' }]
  });
};

module.exports = {
  searchFlights, searchAirports, searchNearbyAirports, getAirportByCode, getAvailableFilters, getDatePrices,
  createAirline, updateAirline, deleteAirline, getAllAirlines, updateAirlineLogo,
  createAirport, updateAirport, deleteAirport, getAllAirports,
  createFlight, updateFlight, deleteFlight, getAllFlights,
  createSchedule, updateSchedule, deleteSchedule, getAllSchedules, updateFlightStatus,
  getScheduleById
};
