// src/services/asignacionService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ASIGNACIONES_API_URL = `${API_BASE_URL}/asignaciones/`;

export const getAsignaciones = async (params) => {
    const response = await axios.get(ASIGNACIONES_API_URL, { params });
    // Assuming the API returns data in a consistent paginated format or a simple array.
    if (response.data && Array.isArray(response.data.results)) {
        // Handle paginated response
        return response.data.results;
    } else if (Array.isArray(response.data)) {
        // Handle non-paginated array response
        return response.data;
    }
    // If the format is unexpected, return an empty array to avoid errors.
    return [];
};

export const getAsignacionById = (id) => {
    return axios.get(`${ASIGNACIONES_API_URL}${id}/`);
};

export const createAsignacion = (asignacionData) => {

    return axios.post(ASIGNACIONES_API_URL, asignacionData);
};

export const updateAsignacion = (id, asignacionData) => {
    return axios.put(`${ASIGNACIONES_API_URL}${id}/`, asignacionData);
};

export const deleteAsignacion = (id) => {
    return axios.delete(`${ASIGNACIONES_API_URL}${id}/`);
};

export async function procesarAsignaciones(fecha = null) {
  const body = fecha ? JSON.stringify({ fecha }) : JSON.stringify({});
  const response = await fetch(`${ASIGNACIONES_API_URL}asignar-vehiculos-auto-lote/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Error al procesar asignaciones: ' + errorText);
  }
  return response.json();
}
