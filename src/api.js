const API_BASE = (() => {
  const fromQuery = new URLSearchParams(window.location.search).get('api');
  const configured = (window.__CEE_CONFIG__ && window.__CEE_CONFIG__.apiBaseUrl) || fromQuery;
  if (!configured) return '/api/v1';
  return configured.replace(/\/+$/, '') + (/\/api\/v1$/.test(configured.replace(/\/+$/, '')) ? '' : '/api/v1');
})();

let token = localStorage.getItem('cee_token');

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('cee_token', t);
  else localStorage.removeItem('cee_token');
}

export function getToken() {
  return token;
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Request failed');
  return data.data;
}

export default API_BASE;
