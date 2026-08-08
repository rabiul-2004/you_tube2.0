import axios from "axios";

export const BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});
export default axiosInstance;
