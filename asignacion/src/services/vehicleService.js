// src/services/vehicleService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const VEHICULOS_API_URL = `${API_BASE_URL}/vehiculos/`;

// Función para obtener todos los vehículos
export const getVehiculos = async () => {
    let results = [];
    let nextUrl = VEHICULOS_API_URL;
    while (nextUrl) {
        const response = await axios.get(nextUrl);
        const data = response.data;
        if (Array.isArray(data)) {
            results = data;
            nextUrl = null;
        } else if (data && Array.isArray(data.results)) {
            results = results.concat(data.results);
            nextUrl = data.next;
        } else {
            nextUrl = null;
        }
    }
    return results;
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