import { h, Component } from 'preact';
import { route } from 'preact-router';
import style from './style.css'; //
// Importar 'login' (antes loginUser) y 'fetchUserDetails'
import { login, isAuthenticated, fetchUserDetails } from '../../services/authService'; //

export default class LoginPage extends Component { // Renombrado de Login a LoginPage para claridad
    state = {
        username: '',
        password: '',
        error: null,
        isLoading: false,
    };

    componentDidMount() {
        if (isAuthenticated()) {
            route('/', true); // Redirigir si ya está logueado
        }
    }

    handleInput = (e) => {
        this.setState({ [e.target.name]: e.target.value, error: null });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        this.setState({ isLoading: true, error: null });
        const { username, password } = this.state;

        if (!username || !password) {
            this.setState({ error: 'Por favor, ingrese usuario y contraseña.', isLoading: false });
            return;
        }

        try {
            const loginData = await login({ username, password }); // Usar 'login'
            console.log('Token obtenido:', loginData.token);

            // Después de obtener el token, intentar obtener los detalles del usuario.
            // Esto es crucial para que los roles (isSolicitante, isAdminOrStaff) funcionen.
            // Asegúrate de tener un endpoint en tu backend que devuelva los detalles del usuario
            // y que USER_DETAILS_URL en authService.js apunte a él.
            // Si este endpoint no existe, fetchUserDetails devolverá null o un error.
            const userDetails = await fetchUserDetails(); 
            if (userDetails) {
                console.log('Detalles del usuario obtenidos:', userDetails);
            } else {
                console.warn('No se pudieron obtener los detalles del usuario después del login.');
                // Aún así, el login (obtención del token) fue exitoso.
                // Podrías mostrar un mensaje o manejarlo de otra forma si los detalles son cruciales inmediatamente.
            }

            this.setState({ isLoading: false });
            // El evento 'authChange' ya se dispara desde fetchUserDetails o logout si es necesario
            // pero podemos asegurarnos que se dispare para actualizar el App.js
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('authChange'));
            }
            route('/', true); // Redirigir a home

        } catch (err) {
            let errorMessage = 'Error desconocido al iniciar sesión.';
            if (err.response) {
                console.error('Login API Error Response:', err.response.data, err.response.status);
                if (err.response.status === 400) { // DRF authtoken devuelve 400 para credenciales inválidas
                    errorMessage = "Usuario o contraseña incorrectos.";
                    if (err.response.data && err.response.data.non_field_errors) {
                        errorMessage = err.response.data.non_field_errors.join(' ');
                    }
                } else if (typeof err.response.data === 'string' && err.response.data.toLowerCase().includes("<!doctype html>")) {
                    errorMessage = "Error de comunicación con el servidor. Se recibió una respuesta HTML inesperada.";
                } else {
                    errorMessage = `Error del servidor (${err.response.status}). Intente nuevamente.`;
                }
            } else if (err.request) {
                console.error('Login API No Response:', err.request);
                errorMessage = 'No se pudo conectar al servidor. Verifique su conexión e intente más tarde.';
            } else {
                console.error('Login Setup Error:', err.message);
                errorMessage = err.message;
            }
            this.setState({ error: errorMessage, isLoading: false });
        }
    };

    render({}, { username, password, error, isLoading }) { //
        return (
            <div class={style.loginContainer}> {/* */}
                <form onSubmit={this.handleSubmit} class={style.loginForm}> {/* */}
                    <h1>Iniciar Sesión</h1>
                    {error && <p class={style.errorMessage}>{error}</p>} {/* */}
                    <div class={style.inputGroup}> {/* */}
                        <label htmlFor="username">Usuario:</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={username}
                            onInput={this.handleInput}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div class={style.inputGroup}> {/* */}
                        <label htmlFor="password">Contraseña:</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={password}
                            onInput={this.handleInput}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <button type="submit" class={style.submitButton} disabled={isLoading}> {/* */}
                        {isLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        );
    }
}