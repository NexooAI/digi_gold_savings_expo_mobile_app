import axios from 'axios';

const mockApi = axios.create({
  baseURL: 'https://api.nexoo.in', // Use your real API base URL or a mock server
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default mockApi; 