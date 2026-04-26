import axiosInstance from '../../utils/axiosConfig';

const checkinService = {
  getBookingByPNR: async (pnr) => {
    const response = await axiosInstance.get(`/checkin/booking/${pnr}`);
    return response.data;
  },

  confirmCheckin: async (pnr) => {
    const response = await axiosInstance.post('/checkin/confirm', { pnr });
    return response.data;
  },

  downloadBoardingPass: async (id) => {
    const response = await axiosInstance.get(`/checkin/download/${id}`);
    return response.data;
  },

  downloadAllBoardingPasses: async (pnr) => {
    const response = await axiosInstance.get(`/checkin/download-all/${pnr}`);
    return response.data;
  },

  resendEmail: async (pnr) => {
    const response = await axiosInstance.post(`/checkin/resend-email/${pnr}`);
    return response.data;
  }
};

export default checkinService;
