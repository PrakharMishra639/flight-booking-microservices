import axios from 'axios';
import { API_URL, LOCAL_STORAGE_KEYS } from './constants';
import { store } from '../redux/store';
import { logout, setCredentials } from '../redux/slices/authSlice';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // No need to manually inject token as withCredentials will send HttpOnly cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt to refresh token for auth routes (login, register, etc.)
      const authRoutes = ['/auth/login', '/auth/register', '/auth/login-otp', '/oauth/google'];
      const isAuthRoute = authRoutes.some(route => originalRequest.url?.includes(route));
      
      if (isAuthRoute) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const { user, accessTokenExpiresAt } = response.data;

        // Update user in localStorage if needed, but tokens are managed by cookies
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
        if (accessTokenExpiresAt) {
          localStorage.setItem('accessTokenExpiresAt', accessTokenExpiresAt);
        }
        store.dispatch(setCredentials({ user, accessTokenExpiresAt }));

        processQueue(null, null);
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout());
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
