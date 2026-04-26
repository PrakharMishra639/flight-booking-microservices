const { Schedule, Flight, Airline, Airport } = require('../models');
const { Op } = require('sequelize');

class FlightGraph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addEdge(sourceId, destId, schedule) {
    if (!this.adjacencyList.has(sourceId)) {
      this.adjacencyList.set(sourceId, []);
    }
    this.adjacencyList.get(sourceId).push({
      destination: destId,
      schedule: schedule,
      departure: new Date(schedule.departure_time),
      arrival: new Date(schedule.arrival_time),
      duration: schedule.duration_minutes,
      price: parseFloat(schedule.base_price)
    });
  }

  findConnectingFlights(sourceId, destId, maxStops = 3, date) {
    const results = [];
    const visited = new Set();

    const dfs = (currentId, path, totalDuration, totalPrice, lastArrival, stops, layovers) => {
      if (currentId === destId && path.length > 0) {
        results.push({
          path: [...path],
          totalDuration,
          totalPrice,
          stops: path.length - 1,
          layovers: [...layovers]
        });
        return;
      }

      if (stops > maxStops) return;

      const edges = this.adjacencyList.get(currentId) || [];
      for (const edge of edges) {
        if (visited.has(edge.schedule.schedule_id)) continue;

        // Same-airline constraint: All legs must belong to the same airline
        if (path.length > 0) {
          const firstAirlineId = path[0].schedule.Flight?.airline_id;
          const currentAirlineId = edge.schedule.Flight?.airline_id;
          if (firstAirlineId !== currentAirlineId) continue;
        }

        if (lastArrival) {
          const layoverMs = edge.departure.getTime() - lastArrival.getTime();
          const layoverMinutes = layoverMs / (1000 * 60);
          if (layoverMinutes < 60 || layoverMinutes > 480) continue;
        }

        visited.add(edge.schedule.schedule_id);

        const layoverMinutes = lastArrival
          ? (edge.departure.getTime() - lastArrival.getTime()) / (1000 * 60)
          : 0;

        const newLayovers = lastArrival
          ? [...layovers, { minutes: Math.round(layoverMinutes), airport: currentId }]
          : layovers;

        path.push(edge);
        dfs(
          edge.destination,
          path,
          totalDuration + edge.duration + (lastArrival ? layoverMinutes : 0),
          totalPrice + edge.price,
          edge.arrival,
          stops + (path.length > 1 ? 1 : 0),
          newLayovers
        );
        path.pop();
        visited.delete(edge.schedule.schedule_id);
      }
    };

    dfs(sourceId, [], 0, 0, null, 0, []);
    return results;
  }

  rankResults(results, sortBy = 'price') {
    switch (sortBy) {
      case 'price':
        return results.sort((a, b) => a.total_base_price - b.total_base_price);
      case 'duration':
        return results.sort((a, b) => a.total_duration_minutes - b.total_duration_minutes);
      case 'departure':
        return results.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
      case 'stops':
        return results.sort((a, b) => a.stops - b.stops);
      default:
        return results;
    }
  }
}

const buildFlightGraph = async (date) => {
  const graph = new FlightGraph();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfNextDay = new Date(date);
  endOfNextDay.setDate(endOfNextDay.getDate() + 2);
  endOfNextDay.setHours(23, 59, 59, 999);

  const schedules = await Schedule.findAll({
    where: {
      departure_time: { [Op.between]: [startOfDay, endOfNextDay] },
      status: { [Op.ne]: 'CANCELLED' }
    },
    include: [
      { model: Flight, include: [Airline] },
      { model: Airport, as: 'SourceAirport' },
      { model: Airport, as: 'DestAirport' }
    ],
    order: [['departure_time', 'ASC']]
  });

  for (const schedule of schedules) {
    graph.addEdge(schedule.source_airport_id, schedule.dest_airport_id, schedule);
  }

  return graph;
};

module.exports = { buildFlightGraph, FlightGraph };
