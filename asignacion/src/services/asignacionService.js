// src/services/asignacionService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ASIGNACIONES_API_URL = `${API_BASE_URL}/asignaciones/`;

export const getAsignaciones = async () => {
    let results = [];
    let nextUrl = ASIGNACIONES_API_URL;
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

export const getAsignacionById = (id) => {
    return axios.get(`${ASIGNACIONES_API_URL}${id}/`);
};

export const createAsignacion = (asignacionData) => {
    // Para campos ForeignKey como vehiculo y conductor, esperamos IDs.
    // Para DateTimeFields, el formato esperado es YYYY-MM-DDTHH:MM[:SS[.ffffff]][Z]
    // o YYYY-MM-DD HH:MM[:SS[.ffffff]][Z]
    return axios.post(ASIGNACIONES_API_URL, asignacionData);
};

export const updateAsignacion = (id, asignacionData) => {
    return axios.put(`${ASIGNACIONES_API_URL}${id}/`, asignacionData);
};

export const deleteAsignacion = (id) => {
    return axios.delete(`${ASIGNACIONES_API_URL}${id}/`);
};

// Podrías añadir aquí las acciones personalizadas si las necesitas en el frontend
// export const completarAsignacionApi = (id) => {
//     return axios.post(`${ASIGNACIONES_API_URL}${id}/completar/`);
// };
// export const iniciarAsignacionApi = (id) => {
//     return axios.post(`${ASIGNACIONES_API_URL}${id}/iniciar/`);
// };