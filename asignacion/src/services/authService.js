// src/services/authService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

const LOGIN_API_URL = `${API_BASE_URL}/get-token/`; // Corresponde al endpoint de Django

let authToken = null;

export async function loginUser({ username, password }) {
    const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const error = new Error('Login failed');
        error.response = { status: response.status, data: errorData };
        throw error;
    }
    return response.json();
}

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