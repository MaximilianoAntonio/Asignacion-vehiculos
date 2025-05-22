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

export const createVehiculo = (vehiculoData) => {
    // Nota: para POST, PUT, DELETE con archivos (como la foto), necesitarás usar FormData.
    // Por ahora, un ejemplo simple sin manejo de archivos.
    return axios.post(VEHICULOS_API_URL, vehiculoData);
};

export const updateVehiculo = (id, vehiculoData) => {
    return axios.put(`${VEHICULOS_API_URL}${id}/`, vehiculoData);
};

export const deleteVehiculo = (id) => {
    return axios.delete(`${VEHICULOS_API_URL}${id}/`);
};

// Podrías crear archivos similares para conductorService.js y asignacionService.js