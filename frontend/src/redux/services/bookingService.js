import axiosInstance from '../../utils/axiosConfig';

const createBooking = async (bookingData) => {
  const response = await axiosInstance.post('/booking/create', bookingData);
  return response.data;
};

const getBooking = async (bookingId) => {
  const response = await axiosInstance.get(`/booking/${bookingId}`);
  return response.data;
};

const getBookingByPNR = async (pnr) => {
  const response = await axiosInstance.get(`/booking/pnr/${pnr}`);
  return response.data;
};

const getUserBookings = async (page = 1, limit = 5) => {
  const response = await axiosInstance.get(`/booking/user/bookings?page=${page}&limit=${limit}`);
  return response.data;
};

const cancelBooking = async (bookingId) => {
  const response = await axiosInstance.post(`/booking/${bookingId}/cancel`);
  return response.data;
};

const extendTimeout = async (bookingId) => {
  const response = await axiosInstance.post(`/booking/${bookingId}/extend`);
  return response.data;
};

const getSeatsForSchedule = async (scheduleId) => {
  const response = await axiosInstance.get(`/seats/schedule/${scheduleId}`);
  return response.data;
};

const changeSeat = async (bookingId, detailId, seatId) => {
  const response = await axiosInstance.post(`/booking/${bookingId}/change-seat`, { detailId, newSeatId: seatId });
  return response.data;
};

const bookingService = {
  createBooking,
  getBooking,
  getBookingByPNR,
  getUserBookings,
  cancelBooking,
  extendTimeout,
  getSeatsForSchedule,
  changeSeat
};

export default bookingService;
