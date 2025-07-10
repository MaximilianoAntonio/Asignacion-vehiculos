// src/routes/login/index.js
import { h, Component } from 'preact';
import { route } from 'preact-router';
import { motion } from 'framer-motion';
import { loginUser, getToken } from '../../services/authService';
import style from './style.css'; // Crearemos este archivo

class LoginPage extends Component {
    state = {
        username: '',
        password: '',
        error: null,
        loading: false,
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({ loading: true, error: null });
        const { username, password } = this.state;

        loginUser({ username, password })
            .then(data => {
                this.setState({ loading: false });
                if (data.token) {
                    localStorage.setItem('authToken', data.token); // <-- ADD THIS LINE
                    // Guarda TODOS los grupos como array
                    if (data.groups && data.groups.length > 0) {
                        localStorage.setItem('userGroup', JSON.stringify(data.groups));
                    } else {
                        localStorage.setItem('userGroup', '[]');
                    }
                    // Configura axios con el token recién guardado
                    getToken();
                    // Redirigir a una página protegida o al inicio
                    route('/', true);
                } else {
                    this.setState({ error: 'Respuesta inesperada del servidor.' });
                }
            })
            .catch(err => {
                this.setState({ loading: false });
                console.error("Login error:", err.response || err.message || err);
                let errorMessage = 'Error al iniciar sesión.';
                if (err.response && err.response.data && err.response.data.non_field_errors) {
                    errorMessage = err.response.data.non_field_errors.join(' ');
                } else if (err.response && err.response.status === 400) {
                     errorMessage = 'Usuario o contraseña incorrectos.';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                this.setState({ error: errorMessage, loading: false });
            });
    };

    render(_, { username, password, error, loading }) {
        return (
            <div class={style.loginPage}>
                <motion.div 
                    class={style.loginForm}
                    initial={{ opacity: 0, y: -30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <img src="/assets/logo-ssvq.jpg" alt="Logo" class={style.logo} />
                    <h2>Iniciar Sesión</h2>
                    {error && <p class={`error-message ${style.error}`}>{error}</p>}
                    <form onSubmit={this.handleSubmit}>
                        <div class="form-group">
                            <label for="username">Usuario:</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                class="form-control"
                                value={username}
                                onInput={this.handleChange}
                                required
                            />
                        </div>
                        <div class="form-group">
                            <label for="password">Contraseña:</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                class="form-control"
                                value={password}
                                onInput={this.handleChange}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} class="btn btn-primary">
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }
}

export default LoginPage;