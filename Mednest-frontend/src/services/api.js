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
