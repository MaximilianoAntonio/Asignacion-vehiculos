// src/services/vehicleService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const VEHICULOS_API_URL = `${API_BASE_URL}/vehiculos/`; // Verifica que API_BASE_URL sea http://127.0.0.1:8000/api

export const getVehiculos = () => {
    return axios.get(VEHICULOS_API_URL);
};

export const getVehiculoById = (id) => {
    return axios.get(`${VEHICULOS_API_URL}${id}/`);
};

export const createVehiculo = (data) =>
  axios.post(`${API_BASE_URL}/vehiculos/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVehiculo = (id, data) =>
  axios.put(`${API_BASE_URL}/vehiculos/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteVehiculo = (id) => {
    return axios.delete(`${VEHICULOS_API_URL}${id}/`);
};

// Podrías crear archivos similares para conductorService.js y asignacionService.js