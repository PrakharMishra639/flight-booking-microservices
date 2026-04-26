import axiosInstance from '../../utils/axiosConfig';

const initiatePayment = async (bookingId, paymentMethod) => {
  const response = await axiosInstance.post('/payment/initiate', { bookingId, paymentMethod });
  return response.data;
};

const getPaymentStatus = async (paymentId) => {
  const response = await axiosInstance.get(`/payment/status/${paymentId}`);
  return response.data;
};

const manualPaymentCallback = async (bookingId, status, transactionId, paymentMethod = 'CARD') => {
  const response = await axiosInstance.post('/payment/manual-success', {
    bookingId, status, transactionId, paymentMethod
  });
  return response.data;
};

const paymentService = {
  initiatePayment,
  getPaymentStatus,
  manualPaymentCallback,
};

export default paymentService;
