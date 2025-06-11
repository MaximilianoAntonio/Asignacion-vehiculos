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
