import axios from 'axios';

const DEV_USER_ID = '69bb95764168f06db6f394e5';
const API_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

/**
 * Fetches all health records for the dev user.
 */
export const fetchAllRecords = async () => {
  try {
    const response = await apiClient.get(`/records`, {
      params: { userId: DEV_USER_ID, limit: 100 }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
};

/**
 * Uploads a file to get the Cloudinary details.
 */
export const uploadFile = async (formData) => {
  try {
    if (!formData.has('userId')) {
      formData.append('userId', DEV_USER_ID);
    }
    const response = await apiClient.post('/records/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Creates the final record with the uploaded file details.
 */
export const createRecord = async (recordData) => {
  try {
    const payload = { ...recordData, userId: DEV_USER_ID };
    const response = await apiClient.post('/records', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
};

/**
 * Compares two records and retrieves AI insights.
 */
export const compareRecords = async (recordIdA, recordIdB = null) => {
  try {
    const response = await apiClient.post('/records/compare', { recordIdA, recordIdB });
    return response.data;
  } catch (error) {
    console.error('Error comparing records:', error);
    throw error;
  }
};

// ── VITALS ──────────────────────────────────────────

/**
 * Fetches the vitals dashboard for the dev user.
 */
export const fetchVitalsDashboard = async () => {
  try {
    const response = await apiClient.get(`/vitals/dashboard/${DEV_USER_ID}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vitals dashboard:', error);
    throw error;
  }
};

/**
 * Logs a new vital reading.
 */
export const logVital = async (vitalData) => {
  try {
    const payload = { ...vitalData, userId: DEV_USER_ID };
    const response = await apiClient.post('/vitals', payload);
    return response.data;
  } catch (error) {
    console.error('Error logging vital:', error);
    throw error;
  }
};

/**
 * Soft-deletes a vital entry.
 */
export const deleteVital = async (entryId) => {
  try {
    const response = await apiClient.delete(`/vitals/${entryId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting vital:', error);
    throw error;
  }
};

/**
 * Fetches paginated vital history.
 */
export const fetchVitalHistory = async (vitalType, page = 1, limit = 20, from, to) => {
  try {
    const params = { vitalType, page, limit };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await apiClient.get(`/vitals/history/${DEV_USER_ID}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching vital history:', error);
    throw error;
  }
};

/**
 * Fetches vital trends data arrays for charts.
 */
export const fetchVitalTrends = async (vitalType, period = '30d') => {
  try {
    const response = await apiClient.get(`/vitals/trends/${DEV_USER_ID}`, {
      params: { vitalType, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vital trends:', error);
    throw error;
  }
};

/**
 * Fetches AI insights for a given vital type and period.
 */
export const fetchVitalInsight = async (vitalType, period = '30d') => {
  try {
    const response = await apiClient.get(`/vitals/insight/${DEV_USER_ID}`, {
      params: { vitalType, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vital insight:', error);
    throw error;
  }
};

// ── MEDICATIONS ─────────────────────────────────────

export const fetchMedications = async (status) => {
  try {
    const params = { userId: DEV_USER_ID };
    if (status) params.status = status;
    const response = await apiClient.get('/medications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching medications:', error);
    throw error;
  }
};

export const addMedication = async (medData) => {
  try {
    const payload = { ...medData, userId: DEV_USER_ID };
    const response = await apiClient.post('/medications', payload);
    return response.data;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

export const updateMedication = async (id, medData) => {
  try {
    const response = await apiClient.put(`/medications/${id}`, medData);
    return response.data;
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

export const deleteMedication = async (id) => {
  try {
    const response = await apiClient.delete(`/medications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

export const fetchTodaysDoses = async () => {
  try {
    const response = await apiClient.get('/medications/doses/today', {
      params: { userId: DEV_USER_ID }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching today doses:', error);
    throw error;
  }
};

export const logDose = async (doseData) => {
  try {
    const payload = { ...doseData, userId: DEV_USER_ID };
    const response = await apiClient.post('/medications/doses/log', payload);
    return response.data;
  } catch (error) {
    console.error('Error logging dose:', error);
    throw error;
  }
};

export const fetchAdherence = async () => {
  try {
    const response = await apiClient.get(`/medications/adherence/${DEV_USER_ID}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching adherence:', error);
    throw error;
  }
};

export const fetchDrugInfo = async (medicationName) => {
  try {
    const response = await apiClient.post('/medications/drug-info', { medicationName });
    return response.data;
  } catch (error) {
    console.error('Error fetching drug info:', error);
    throw error;
  }
};

export const fetchMedicationById = async (id) => {
  try {
    const response = await apiClient.get(`/medications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medication by id:', error);
    throw error;
  }
};

export const fetchDoseHistory = async (params) => {
  try {
    const response = await apiClient.get('/medications/doses/history', {
      params: { ...params, userId: DEV_USER_ID }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dose history:', error);
    throw error;
  }
};

export const fetchCaregiverView = async () => {
  try {
    const response = await apiClient.get(`/medications/caregiver/${DEV_USER_ID}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching caregiver view:', error);
    throw error;
  }
};

export { DEV_USER_ID };
