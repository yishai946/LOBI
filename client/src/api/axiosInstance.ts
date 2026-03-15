import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for refresh token cookie
});

// Request interceptor to add the access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        // Save new token
        localStorage.setItem('accessToken', accessToken);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
