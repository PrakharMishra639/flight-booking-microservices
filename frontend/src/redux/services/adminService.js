import axiosInstance from '../../utils/axiosConfig';

// Dashboard
const getDashboardStats = async () => {
  const response = await axiosInstance.get('/admin/dashboard/stats');
  return response.data;
};

// Airlines
const getAirlines = async () => {
  const response = await axiosInstance.get('/admin/airlines');
  return response.data;
};

const createAirline = async (data) => {
  const response = await axiosInstance.post('/admin/airlines', data);
  return response.data;
};

const updateAirline = async (id, data) => {
  const response = await axiosInstance.put(`/admin/airlines/${id}`, data);
  return response.data;
};

const deleteAirline = async (id) => {
  const response = await axiosInstance.delete(`/admin/airlines/${id}`);
  return response.data;
};

const uploadAirlineLogo = async (id, file) => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await axiosInstance.post(`/admin/airlines/${id}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Airports
const getAirports = async (params = {}) => {
  const response = await axiosInstance.get('/admin/airports', { params });
  return response.data;
};

const createAirport = async (data) => {
  const response = await axiosInstance.post('/admin/airports', data);
  return response.data;
};

const updateAirport = async (id, data) => {
  const response = await axiosInstance.put(`/admin/airports/${id}`, data);
  return response.data;
};

const deleteAirport = async (id) => {
  const response = await axiosInstance.delete(`/admin/airports/${id}`);
  return response.data;
};

// Flights
const getFlights = async (params = {}) => {
  const response = await axiosInstance.get('/admin/flights', { params });
  return response.data;
};

const createFlight = async (data) => {
  const response = await axiosInstance.post('/admin/flights', data);
  return response.data;
};

const updateFlight = async (id, data) => {
  const response = await axiosInstance.put(`/admin/flights/${id}`, data);
  return response.data;
};

const deleteFlight = async (id) => {
  const response = await axiosInstance.delete(`/admin/flights/${id}`);
  return response.data;
};

// Schedules
const getSchedules = async (params = {}) => {
  const response = await axiosInstance.get('/admin/schedules', { params });
  return response.data;
};

const createSchedule = async (data) => {
  const response = await axiosInstance.post('/admin/schedules', data);
  return response.data;
};

const updateSchedule = async (id, data) => {
  const response = await axiosInstance.put(`/admin/schedules/${id}`, data);
  return response.data;
};

const deleteSchedule = async (id) => {
  const response = await axiosInstance.delete(`/admin/schedules/${id}`);
  return response.data;
};

const updateFlightStatus = async (id, status, delayMinutes) => {
  const response = await axiosInstance.put(`/admin/schedules/${id}/status`, { status, delayMinutes });
  return response.data;
};

// Bookings & Payments
const getAllBookings = async () => {
  const response = await axiosInstance.get('/admin/bookings');
  return response.data;
};

const getAllPayments = async () => {
  const response = await axiosInstance.get('/admin/payments');
  return response.data;
};

const getUsers = async () => {
  const response = await axiosInstance.get('/admin/users');
  return response.data;
};

const updateUserRole = async (id, role) => {
  const response = await axiosInstance.put(`/admin/users/${id}/role`, { role });
  return response.data;
};

const getLogs = async (type = 'combined') => {
  const response = await axiosInstance.get(`/admin/logs?type=${type}`);
  return response.data;
};

// PAGINATION and filtering support structured logs
const getStructuredLogs = async (params = {}) => {
  // Pass category, level, startDate, endDate, page, limit
  const response = await axiosInstance.get('/admin/system-logs', { params });
  return response.data;
};

const adminService = {
  getDashboardStats,
  getAirlines,
  createAirline,
  updateAirline,
  deleteAirline,
  uploadAirlineLogo,
  getAirports,
  createAirport,
  updateAirport,
  deleteAirport,
  getFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  updateFlightStatus,
  getAllBookings,
  getAllPayments,
  getUsers,
  updateUserRole,
  getLogs,
  getStructuredLogs,
};

export default adminService;
