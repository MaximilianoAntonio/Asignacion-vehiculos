// src/services/asignacionService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ASIGNACIONES_API_URL = `${API_BASE_URL}/asignaciones/`;

export const getAsignaciones = async (params) => {
    const response = await axios.get(ASIGNACIONES_API_URL, { params });
    let asignaciones = [];
    
    // Assuming the API returns data in a consistent paginated format or a simple array.
    if (response.data && Array.isArray(response.data.results)) {
        // Handle paginated response
        asignaciones = response.data.results;
    } else if (Array.isArray(response.data)) {
        // Handle non-paginated array response
        asignaciones = response.data;
    } else {
        // If the format is unexpected, return an empty array to avoid errors.
        return [];
    }
    
    // Normalizar estados de las asignaciones
    return asignaciones.map(asignacion => ({
        ...asignacion,
        estado: normalizeEstado(asignacion.estado)
    }));
};

// Función para normalizar estados
export const normalizeEstado = (estado) => {
    if (!estado) return 'pendiente_auto';
    
    const estadoLower = estado.toLowerCase().trim();
    const mapeoEstados = {
        'pendiente': 'pendiente_auto',
        'pendiente_auto': 'pendiente_auto',
        'en_curso': 'activa',
        'en curso': 'activa',
        'encurso': 'activa',
        'activa': 'activa',
        'programada': 'programada',
        'finalizada': 'completada',
        'finalizado': 'completada',
        'completada': 'completada',
        'completado': 'completada',
        'terminada': 'completada',
        'terminado': 'completada',
        'cancelada': 'cancelada',
        'cancelado': 'cancelada',
        'anulada': 'cancelada',
        'anulado': 'cancelada',
        'aprobada': 'programada',
        'aprobado': 'programada',
        'fallo_auto': 'fallo_auto'
    };
    
    return mapeoEstados[estadoLower] || 'pendiente_auto';
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
    throw new Error(`Error al procesar asignaciones: ${  errorText}`);
  }
  return response.json();
}
