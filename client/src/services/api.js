// ============================================================
// MediSecure API Service Layer
// All configuration is driven from client/.env (VITE_ vars).
// ============================================================

// ── Config from environment variables ──────────────────────
const API_BASE_URL   = import.meta.env.VITE_API_BASE_URL  || 'http://localhost:5001';
const API_PREFIX     = import.meta.env.VITE_API_PREFIX     || '/api';
const TOKEN_KEY      = import.meta.env.VITE_TOKEN_KEY      || 'medisecure_token';
const TIMEOUT_MS     = Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000;

/**
 * The base path used for every API call.
 * In development Vite proxies /api → backend, so we use just /api.
 * In production (if backend is on same origin) this still works.
 * If backend is on a different origin in production set VITE_API_BASE_URL
 * and un-comment the absolute URL line below.
 */
const API_BASE = API_PREFIX; // → '/api'
// const API_BASE = `${API_BASE_URL}${API_PREFIX}`; // absolute (cross-origin)

// ── Helpers ────────────────────────────────────────────────

/** Retrieve the stored JWT from localStorage */
const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Store a JWT in localStorage */
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

/** Remove the JWT from localStorage (logout) */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Build full endpoint URL */
const buildUrl = (endpoint) =>
  `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

/** Abort-controller based timeout wrapper */
const withTimeout = (promise, ms) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return promise
    .then((res) => { clearTimeout(id); return res; })
    .catch((err) => { clearTimeout(id); throw err; });
};

// ── Core fetch wrapper ─────────────────────────────────────

/**
 * apiFetch – central function for all backend requests.
 *
 * @param {string}  endpoint  - API path, e.g. '/auth/login'
 * @param {object}  options   - fetch options (method, body, headers …)
 * @returns {Promise<object>} - parsed JSON response
 * @throws  {Error}           - on network error, timeout, or HTTP error
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON (even on error status so we get the server message)
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server returned non-JSON response (${response.status})`);
    }

    if (!response.ok) {
      const message =
        data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(message);
      err.status = response.status;
      err.data   = data;
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s (${endpoint})`);
    }
    throw err;
  }
};

// ── Convenience method helpers ─────────────────────────────

/** GET  /api/<endpoint> */
export const apiGet = (endpoint, headers = {}) =>
  apiFetch(endpoint, { method: 'GET', headers });

/** POST /api/<endpoint> with JSON body */
export const apiPost = (endpoint, body = {}, headers = {}) =>
  apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });

/** PUT  /api/<endpoint> with JSON body */
export const apiPut = (endpoint, body = {}, headers = {}) =>
  apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers,
  });

/** PATCH /api/<endpoint> with JSON body */
export const apiPatch = (endpoint, body = {}, headers = {}) =>
  apiFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers,
  });

/** DELETE /api/<endpoint> */
export const apiDelete = (endpoint, headers = {}) =>
  apiFetch(endpoint, { method: 'DELETE', headers });

/** POST multipart/form-data (file uploads) – do NOT set Content-Type manually */
export const apiUpload = (endpoint, formData) => {
  const token = getToken();
  return apiFetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Content-Type is intentionally omitted so the browser sets the boundary
    },
  });
};

// ── Named API route groups ─────────────────────────────────
// Each group wraps the common patterns for a feature domain.

/** Auth routes */
export const authApi = {
  login:          (body) => apiPost('/auth/login', body),
  register:       (body) => apiPost('/auth/register', body),
  sendOtp:        (body) => apiPost('/auth/send-otp', body),
  verifyOtp:      (body) => apiPost('/auth/verify-otp', body),
  me:             ()     => apiGet('/auth/me'),
};

/** Patient routes */
export const patientApi = {
  profile:        ()     => apiGet('/patients/profile'),
  updateProfile:  (body) => apiPut('/patients/profile', body),
  myQr:           ()     => apiGet('/patients/my-qr'),
  dashboard:      ()     => apiGet('/patients/dashboard'),
};

/** Medical Records */
export const recordApi = {
  list:           ()     => apiGet('/medical-records'),
  get:            (id)   => apiGet(`/medical-records/${id}`),
  create:         (body) => apiPost('/medical-records', body),
};

/** Prescriptions */
export const prescriptionApi = {
  list:           ()     => apiGet('/prescriptions'),
  create:         (body) => apiPost('/prescriptions', body),
  fulfill:        (id)   => apiPatch(`/prescriptions/${id}/fulfill`),
};

/** Lab reports */
export const labApi = {
  list:           ()     => apiGet('/labs'),
  create:         (body) => apiPost('/labs', body),
  get:            (id)   => apiGet(`/labs/${id}`),
};

/** Vitals */
export const vitalsApi = {
  list:           ()     => apiGet('/vitals'),
  create:         (body) => apiPost('/vitals', body),
};

/** Appointments */
export const appointmentApi = {
  list:           ()     => apiGet('/appointments'),
  create:         (body) => apiPost('/appointments', body),
  update:         (id, body) => apiPut(`/appointments/${id}`, body),
};

/** Consent */
export const consentApi = {
  list:           ()     => apiGet('/consent'),
  grant:          (body) => apiPost('/consent', body),
  revoke:         (id)   => apiDelete(`/consent/${id}`),
};

/** Emergency access */
export const emergencyApi = {
  trigger:        (body) => apiPost('/emergency/trigger', body),
  list:           ()     => apiGet('/emergency'),
};

/** Audit logs */
export const auditApi = {
  list:           (params = '') => apiGet(`/audit-logs${params ? `?${params}` : ''}`),
};

/** Admin */
export const adminApi = {
  analytics:      ()     => apiGet('/admin/analytics'),
  users:          ()     => apiGet('/admin/users'),
  roles:          ()     => apiGet('/admin/roles'),
  updateUserRole: (id, body) => apiPut(`/admin/users/${id}/role`, body),
};

/** Government schemes */
export const schemeApi = {
  hospitals:      (params = '') => apiGet(`/schemes/hospitals${params ? `?${params}` : ''}`),
  packages:       (params = '') => apiGet(`/schemes/packages${params ? `?${params}` : ''}`),
  checkEligibility: (body)     => apiPost('/schemes/check-eligibility', body),
  rationVerify:   (body)        => apiPost('/schemes/ration-verify', body),
  myEligibility:  ()            => apiGet('/schemes/my-eligibility'),
  notifications:  ()            => apiGet('/schemes/notifications'),
  hospitalRequests: ()          => apiGet('/schemes/hospital-requests'),
  submitRequest:  (body)        => apiPost('/schemes/submit-request', body),
  updateRequest:  (id, body)    => apiPut(`/schemes/requests/${id}`, body),
  family:         ()            => apiGet('/schemes/family'),
  addFamily:      (body)        => apiPost('/schemes/family', body),
  removeFamily:   (id)          => apiDelete(`/schemes/family/${id}`),
};

/** AI Government Scheme Recommendation & Auto-Form Filling Assistant */
export const schemeAssistantApi = {
  getSchemes: (params = '') => apiGet(`/schemes/assistant/schemes${params ? `?${params}` : ''}`),
  getSchemeById: (schemeId) => apiGet(`/schemes/assistant/schemes/${schemeId}`),
  getProfile: (patientUid) => apiGet(`/schemes/assistant/profile/${patientUid}`),
  updateProfile: (patientUid, body) => apiPut(`/schemes/assistant/profile/${patientUid}`, body),
  uploadDocument: (formData) => apiUpload('/schemes/assistant/upload-document', formData),
  getDocuments: (patientUid) => apiGet(`/schemes/assistant/documents/${patientUid}`),
  evaluateEligibility: (patientUid) => apiPost(`/schemes/assistant/evaluate/${patientUid}`),
  autofillForm: (patientUid, schemeId) => apiPost('/schemes/assistant/autofill', { patientUid, schemeId }),
  submitApplication: (payload) => apiPost('/schemes/assistant/submit-application', payload),
  getApplications: (patientUid) => apiGet(`/schemes/assistant/applications/${patientUid}`),
  updateApplicationStatus: (applicationId, body) => apiPatch(`/schemes/assistant/applications/${applicationId}/status`, body),
};

/** QR routes */
export const qrApi = {
  generate:       ()     => apiGet('/qr/generate'),
  scan:           (body) => apiPost('/qr/scan', body),
};

/** AI Document Detection & Verification */
export const documentApi = {
  verify: (formData) => apiFetch('/documents/verify', { method: 'POST', body: formData }),
  patientRecords: (patientUid) => apiGet(`/documents/patient/${patientUid}`),
  adminAll: (status = '') => apiGet(`/documents/admin/all${status ? `?status=${status}` : ''}`),
  review: (verificationId, body) => apiFetch(`/documents/review/${verificationId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  health: () => apiGet('/documents/health'),
};

// ── Export config constants for use in components ──────────
export const apiConfig = {
  baseUrl:    API_BASE_URL,
  apiPrefix:  API_PREFIX,
  tokenKey:   TOKEN_KEY,
  timeoutMs:  TIMEOUT_MS,
};

export default apiFetch;
