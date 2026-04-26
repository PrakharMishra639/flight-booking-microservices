import axiosInstance from '../../utils/axiosConfig';

const searchFlights = async (params) => {
  // e.g., source, destination, date, passengers, stops, sortBy
  const response = await axiosInstance.get('/search/flights', { params });
  
  // Adapt new backend schema locally for React architecture compatibility
  if (response.data && response.data.results) {
    response.data.results = response.data.results.map(r => ({
      ...r,
      segments: r.legs || r.segments,
      totalPrice: r.total_base_price || r.totalPrice,
      totalDuration: r.total_duration_minutes || r.totalDuration
    }));
  }
  
  return response.data;
};

const getFilters = async (source, destination, date) => {
  const response = await axiosInstance.get('/search/filters', { params: { source, destination, date } });
  return response.data;
};

const getDatePrices = async (source, destination, startDate, endDate) => {
  const response = await axiosInstance.get('/search/prices', { params: { source, destination, startDate, endDate } });
  return response.data;
};

const searchAirports = async (q) => {
  if (!q) return [];
  const response = await axiosInstance.get('/search/airports', { params: { q } });
  return response.data;
};

const getAirportByCode = async (code) => {
  const response = await axiosInstance.get(`/search/airports/${code}`);
  return response.data;
};

const getNearbyAirports = async (lat, lng, radius = 150) => {
  const response = await axiosInstance.get('/search/airports/nearby', { params: { lat, lng, radius } });
  return response.data;
};

const flightService = {
  searchFlights,
  getFilters,
  getDatePrices,
  searchAirports,
  getAirportByCode,
  getNearbyAirports,
};

export default flightService;
