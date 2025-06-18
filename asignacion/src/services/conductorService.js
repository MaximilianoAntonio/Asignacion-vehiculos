// src/services/conductorService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const CONDUCTORES_API_URL = `${API_BASE_URL}/conductores/`;
const REGISTROS_TURNO_API_URL = `${API_BASE_URL}/registros-turno/`;

export const getConductores = async () => {
    let results = [];
    let nextUrl = CONDUCTORES_API_URL;
    while (nextUrl) {
        const response = await axios.get(nextUrl);
        const data = response.data;
        if (Array.isArray(data)) {
            // No paginado: la respuesta es el array directamente
            results = data;
            nextUrl = null;
        } else if (data && Array.isArray(data.results)) {
            // Paginado: la respuesta tiene results y next
            results = results.concat(data.results);
            nextUrl = data.next;
        } else {
            // Respuesta inesperada o data es undefined
            nextUrl = null;
        }
    }
    return results;
};

export const getConductorById = (id) => {
    return axios.get(`${CONDUCTORES_API_URL}${id}/`);
};

export const createConductor = (conductorData) => {
    return axios.post(CONDUCTORES_API_URL, conductorData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const updateConductor = (id, conductorData) => {
    return axios.put(`${CONDUCTORES_API_URL}${id}/`, conductorData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteConductor = (id) => {
    return axios.delete(`${CONDUCTORES_API_URL}${id}/`);
};

export const iniciarTurno = (id) => {
    return axios.post(`${CONDUCTORES_API_URL}${id}/iniciar-turno/`, {}, {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const finalizarTurno = (id) => {
    return axios.post(`${CONDUCTORES_API_URL}${id}/finalizar-turno/`, {}, {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const getTurnosByConductor = (params) => {
    return axios.get(REGISTROS_TURNO_API_URL, { params });
};