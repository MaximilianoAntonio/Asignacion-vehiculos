import axios from 'axios';
import { API_BASE_URL } from '../config';

const TURNOS_API_URL = `${API_BASE_URL}/registros-turno/`;

export const getTurnos = (params) =>
  axios.get(TURNOS_API_URL, { params }).then(res => res.data);

export const updateTurno = (id, data) =>
  axios.patch(`${TURNOS_API_URL}${id}/`, data, {
    headers: { 'Content-Type': 'application/json' },
  });

export const deleteTurno = (id) =>
  axios.delete(`${TURNOS_API_URL}${id}/`);
