/**
 * Frontend API client — all requests go through the Express backend proxy.
 * Never imports secrets.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Server returned non-JSON response (${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data?.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

// ── Complaints ────────────────────────────────────────────────────────────────

export const complaintsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    return request(`/complaints${qs ? `?${qs}` : ''}`);
  },

  get: (id) => request(`/complaints/${id}`),

  stats: () => request('/complaints/stats'),

  submit: (data) => request('/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  detectRecurring: (id) => request(`/complaints/${id}/detect-recurring`, {
    method: 'POST',
  }),

  seedDemo: () => request('/complaints/seed-demo', { method: 'POST' }),
};

// ── Analysis ──────────────────────────────────────────────────────────────────

export const analysisApi = {
  analyze: (data) => request('/analysis/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  status: () => request('/analysis/status'),
};

// ── Health ────────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => request('/health'),
};
