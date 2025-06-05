import axios from 'axios';
import { API_BASE_URL } from '../config'; //

const LOGIN_API_URL = `${API_BASE_URL}/get-token/`; //
const TOKEN_STORAGE_KEY = 'userAuthToken'; // Key for storing the token
const USER_INFO_STORAGE_KEY = 'currentUserInfo'; // Key for storing fetched user details

// Renamed from loginUser to just 'login' for consistency with common patterns
export const login = async (credentials) => {
    try {
        const response = await axios.post(LOGIN_API_URL, credentials); //
        if (response.data && response.data.token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
            // After getting the token, clear any old user info.
            // User details should be fetched in a separate step.
            localStorage.removeItem(USER_INFO_STORAGE_KEY);
            return response.data; // Contains { token: "..." }
        } else {
            // Should not happen if API call is successful and token is present
            throw new Error('Token no recibido del servidor.');
        }
    } catch (error) {
        console.error('Error en servicio de login:', error.response || error.message);
        // Re-throw the error so the component can handle it and display a message
        throw error; 
    }
};

// Placeholder: You need a backend endpoint (e.g., /api/auth/user/ or /api/me/)
// that uses TokenAuthentication and returns serialized user data (using UserDetailSerializer).
export const fetchUserDetails = async () => {
    const token = getToken();
    if (!token) return null;

    // IMPORTANT: Replace with your actual user details endpoint URL
    const USER_DETAILS_URL = `${API_BASE_URL}/auth/user/`; // This is a common dj-rest-auth endpoint.
                                                        // If you don't use dj-rest-auth for this, create your own.
                                                        // For now, this will likely fail if the endpoint doesn't exist.
    try {
        const response = await axios.get(USER_DETAILS_URL, {
            headers: getAuthHeaders(false) // Send token, no Content-Type needed for GET
        });
        if (response.data) {
            localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(response.data));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('authChange')); // Notify UI to update with user info
            }
            return response.data;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener detalles del usuario:", error.response || error.message);
        // If fetching user details fails (e.g., token invalid, endpoint issue),
        // clear stored info and potentially log out.
        localStorage.removeItem(USER_INFO_STORAGE_KEY);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout(); // Token is invalid or insufficient permissions
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('authChange')); // Notify UI that user info might be gone
        }
        return null;
    }
};


export const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY); // Or your actual token key
    localStorage.removeItem(USER_INFO_STORAGE_KEY); // Or your actual user info key
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authChange'));
    }
};

export const getToken = () => { //
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_STORAGE_KEY); //
    }
    return null;
};

export const getUserInfo = () => { //
    if (typeof window !== 'undefined') {
        const userInfo = localStorage.getItem(USER_INFO_STORAGE_KEY);
        try {
            return userInfo ? JSON.parse(userInfo) : null; //
        } catch (e) {
            console.error("Error al parsear userInfo de localStorage", e);
            return null;
        }
    }
    return null;
};

export const isAuthenticated = () => { //
    return !!getToken(); //
};

export const getUserGroups = () => {
    const user = getUserInfo();
    // Asegurarse que user.groups es un array
    return user && Array.isArray(user.groups) ? user.groups : [];
};

export const isSolicitante = () => {
    const groups = getUserGroups();
    return groups.includes('Solicitantes de Traslados'); // Nombre exacto del grupo
};

export const isAdminOrStaff = () => {
    const user = getUserInfo();
    if (user && (user.is_staff || user.is_superuser)) { // Estos campos deben venir de fetchUserDetails
        return true;
    }
    // Fallback como hint para UI, la verdadera seguridad está en el backend.
    return isAuthenticated() && !isSolicitante();
};

export const getAuthHeaders = (includeContentType = true) => {
    const token = getToken();
    const headers = {};
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        // Para DRF TokenAuthentication, el header es 'Token <token_value>'
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
};