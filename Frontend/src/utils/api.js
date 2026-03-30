const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

const createFetchRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auditify_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      localStorage.removeItem('auditify_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      
      const errorData = await response.json().catch(() => ({}));
      return Promise.reject({ response: { status: 401, data: errorData } });
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      return Promise.reject({ response: { status: response.status, data } });
    }

    return { data, status: response.status };

  } catch (error) {
    return Promise.reject(error);
  }
};

const api = {
  get: (endpoint, options) => createFetchRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => createFetchRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => createFetchRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => createFetchRequest(endpoint, { method: 'DELETE', ...options }),
};

export default api;
