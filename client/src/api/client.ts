import axios from 'axios';

// デフォルトは同一オリジンの`/api`を叩く。VITE_API_URL を指定すればそちらを使用。
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;


