// src/services/authService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const LOGIN_API_URL = `${API_BASE_URL}/get-token/`; // Corresponde al endpoint de Django

// Variable para almacenar el token globalmente (o usar localStorage/contexto Preact)
let authToken = null;

export const loginUser = (credentials) => {
    return axios.post(LOGIN_API_URL, credentials)
        .then(response => {
            if (response.data.token) {
                authToken = response.data.token;
                // Opcional: Guardar el token en localStorage para persistencia
                localStorage.setItem('authToken', authToken);
                axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
            }
            return response.data;
        });
};

export const logoutUser = () => {
    authToken = null;
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    // Aquí podrías querer redirigir al usuario o actualizar el estado de la UI
};

export const getToken = () => {
    if (!authToken) {
        authToken = localStorage.getItem('authToken');
        if (authToken) {
             axios.defaults.headers.common['Authorization'] = `Token ${authToken}`;
        }
    }
    return authToken;
};

// Llama a getToken al inicio para configurar el header si ya existe un token
getToken();