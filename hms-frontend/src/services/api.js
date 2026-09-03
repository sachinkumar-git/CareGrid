import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

const safe = async (fn) => {
    try { return await fn(); }
    catch (err) { return { success: false, message: err.response?.data?.message || 'Server error. Please try again.' }; }
};

export const loginUser = (creds) => safe(async () => (await api.post('/login', creds)).data);
export const registerUser = (data) => safe(async () => (await api.post('/register', data)).data);

export const getAdminStats = () => safe(async () => (await api.get('/admin/stats')).data);
export const getDoctors = () => safe(async () => (await api.get('/doctors')).data);
export const addDoctor = (data) => safe(async () => (await api.post('/admin/add-doctor', data)).data);
export const deleteDoctor = (doc_id) => safe(async () => (await api.delete(`/admin/delete-doctor/${doc_id}`)).data);

export const getPatientAppointments = (pid) => safe(async () => (await api.get(`/patient/appointments/${pid}`)).data);

export const getDoctorProfile = async (uid) => {
    try {
        const res = await api.get(`/doctor/profile/${uid}`);
        return res.data;
    } catch (err) {
        console.error('getDoctorProfile error:', err);
        return null;
    }
};
export const getDoctorAppointments = (did) => safe(async () => (await api.get(`/doctor/appointments/${did}`)).data);
export const updateAppointmentStatus = (data) => safe(async () => (await api.put('/appointments/update-status', data)).data);
export const cancelAppointment = (app_id) => safe(async () => (await api.put(`/appointments/cancel/${app_id}`)).data);
export const getAdminAppointments = () => safe(async () => (await api.get('/admin/appointments')).data);
export const predictDepartment = (symptoms) => safe(async () => (await api.post('/patient/predict-department', { symptoms })).data);
export const addPrescription = (data) => safe(async () => (await api.post('/doctor/add-prescription', data)).data);
export const getReceiptData = (app_id) => safe(async () => (await api.get(`/patient/receipt/${app_id}`)).data);