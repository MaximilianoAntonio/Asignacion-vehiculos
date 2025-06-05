// src/components/app.js
import { h, Component } from 'preact';
import { Router, route } from 'preact-router'; // Importa route
import { getToken, logoutUser } from '../services/authService'; // Importa funciones de auth

import Header from './header';
import Home from '../routes/home';
import VehiculosPage from '../routes/vehiculos';
import ConductoresPage from '../routes/conductores';
import LoginPage from '../routes/login'; // Nueva importación
import AsignacionesPage from '../routes/asignaciones'; // Nueva importación


// Componente para rutas protegidas (ejemplo básico)
const PrivateRoute = ({ component: Comp, ...props }) => {
    if (!getToken()) {
        route('/login', true); // Redirige a login si no hay token
        return null; // Evita renderizar el componente protegido
    }
    return <Comp {...props} />;
};


export default class App extends Component {
    state = {
        currentUrl: '',
        isLoggedIn: !!getToken(), // Inicializa el estado de login
    };

    componentDidMount() {
        // Forzar actualización del header si el estado de login cambia (ej. al cargar la app)
        this.setState({ isLoggedIn: !!getToken() });
    }

    handleRoute = e => {
        this.currentUrl = e.url;
        // Forzar re-renderizado para que el header se actualice si es necesario
        // o manejar el estado de login de forma más global (Context API, Zustand, etc.)
        this.setState({ currentUrl: e.url, isLoggedIn: !!getToken() });
    };

    handleLogout = () => {
        logoutUser();
        this.setState({ isLoggedIn: false });
        route('/login', true);
    };

    render() {
        return (
            <div id="app">
                <Header isLoggedIn={this.state.isLoggedIn} onLogout={this.handleLogout} />
                <Router onChange={this.handleRoute}>
                    <Home path="/" />
                    <LoginPage path="/login" />
                    
                    <PrivateRoute component={VehiculosPage} path="/vehiculos" />
                    <PrivateRoute component={ConductoresPage} path="/conductores" />
                    <PrivateRoute component={AsignacionesPage} path="/asignaciones" /> 
                </Router>
            </div>
        );
    }
}