// src/services/conductorService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const CONDUCTORES_API_URL = `${API_BASE_URL}/conductores/`;

export const getConductores = () => {
    return axios.get(CONDUCTORES_API_URL);
};

export const getConductorById = (id) => {
    return axios.get(`${CONDUCTORES_API_URL}${id}/`);
};

export const createConductor = (conductorData) => {
    return axios.post(CONDUCTORES_API_URL, conductorData);
};

export const updateConductor = (id, conductorData) => {
    return axios.put(`${CONDUCTORES_API_URL}${id}/`, conductorData);
};

export const deleteConductor = (id) => {
    return axios.delete(`${CONDUCTORES_API_URL}${id}/`);
};