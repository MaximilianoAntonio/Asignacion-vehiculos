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
    // Normalizar el estado antes de enviar al servidor
    const dataNormalizada = {
        ...asignacionData,
        estado: normalizeEstado(asignacionData.estado || 'pendiente_auto')
    };
    
    console.log('Creando asignación con datos normalizados:', dataNormalizada);
    return axios.post(ASIGNACIONES_API_URL, dataNormalizada);
};

export const updateAsignacion = (id, asignacionData) => {
    // Normalizar el estado antes de enviar al servidor
    const dataNormalizada = {
        ...asignacionData,
        estado: normalizeEstado(asignacionData.estado)
    };
    
    console.log('Actualizando asignación con datos normalizados:', dataNormalizada);
    return axios.put(`${ASIGNACIONES_API_URL}${id}/`, dataNormalizada);
};

export const deleteAsignacion = (id) => {
    return axios.delete(`${ASIGNACIONES_API_URL}${id}/`);
};

export async function procesarAsignaciones(fecha = null) {
  try {
    const body = {};
    
    if (fecha) {
      // Asegurar que la fecha esté en formato YYYY-MM-DD
      const fechaObj = new Date(fecha);
      if (!isNaN(fechaObj.getTime())) {
        body.fecha = fecha;
      } else {
        // Si la fecha no es válida, usar la fecha actual
        const hoy = new Date();
        body.fecha = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
    } else {
      // Si no se proporciona fecha, usar la fecha actual
      const hoy = new Date();
      body.fecha = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    console.log('Procesando asignaciones para fecha:', body.fecha);
    
    const response = await fetch(`${ASIGNACIONES_API_URL}asignar-vehiculos-auto-lote/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Intentar parsear como JSON para obtener más detalles
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          throw new Error(`${errorJson.error} (${response.status})`);
        } else if (errorJson.detail) {
          throw new Error(`${errorJson.detail} (${response.status})`);
        }
      } catch (parseError) {
        // Si no es JSON válido, usar el texto plano
      }
      
      throw new Error(`Error al procesar asignaciones (${response.status}): ${errorText}`);
    }
    
    const resultado = await response.json();
    return resultado;
    
  } catch (error) {
    // Agregar información adicional sobre el tipo de error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      error.message = 'Error de conexión con el servidor. Verifique que el backend esté funcionando.';
    }
    
    throw error;
  }
}

// Función de diagnóstico para verificar recursos disponibles
export async function verificarRecursosDisponibles(fecha = null) {
  try {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    const response = await fetch(`${ASIGNACIONES_API_URL}diagnostico-recursos/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ fecha: fechaConsulta }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.warn('Endpoint de diagnóstico no disponible, usando verificación básica');
      return { 
        vehiculos_disponibles: 0, 
        conductores_disponibles: 0,
        asignaciones_pendientes: 0 
      };
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Error en verificación de recursos:', error);
    return { 
      vehiculos_disponibles: 0, 
      conductores_disponibles: 0,
      asignaciones_pendientes: 0 
    };
  }
}

// Función para verificar conectividad con el backend
export async function verificarConectividad() {
  try {
    const response = await fetch(`${ASIGNACIONES_API_URL}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    
    return {
      conectado: response.ok || response.status === 401, // 401 significa que el servidor responde pero necesita autenticación
      status: response.status,
      url: `${ASIGNACIONES_API_URL}`,
      autenticado: response.ok,
      mensaje: response.status === 401 ? 'Servidor disponible pero requiere autenticación' : 
               response.ok ? 'Conectado y autenticado' : 
               `Error HTTP ${response.status}`
    };
  } catch (error) {
    return {
      conectado: false,
      autenticado: false,
      error: error.message,
      url: `${ASIGNACIONES_API_URL}`,
      mensaje: 'No se puede conectar al servidor'
    };
  }
}
