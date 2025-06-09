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
        isLoggedIn: !!getToken(),
        userGroup: localStorage.getItem('userGroup') || '', // <-- Añade esto
    };


    componentDidMount() {
        // Forzar actualización del header si el estado de login cambia (ej. al cargar la app)
        this.setState({ isLoggedIn: !!getToken() });
    }

    handleRoute = e => {
        this.currentUrl = e.url;
        this.setState({ 
            currentUrl: e.url, 
            isLoggedIn: !!getToken(),
            userGroup: localStorage.getItem('userGroup') || '', // <-- Añade esto
        });
    };

    handleLogout = () => {
        logoutUser();
        localStorage.removeItem('userGroup'); // Limpia el grupo al salir
        this.setState({ isLoggedIn: false, userGroup: '' });
        route('/login', true);
    };

    render() {
        return (
            <div id="app">
                <Header 
                    isLoggedIn={this.state.isLoggedIn} 
                    onLogout={this.handleLogout}
                    userGroup={this.state.userGroup} // <-- Pasa el grupo aquí
                />
                <Router onChange={this.handleRoute}>
            <Home path="/" />
            <LoginPage path="/login" />
            <PrivateRoute component={VehiculosPage} path="/vehiculos" />
            <PrivateRoute component={ConductoresPage} path="/conductores" />
            <PrivateRoute component={AsignacionesPage} path="/asignaciones" userGroup={this.state.userGroup} />
        </Router>
            </div>
        );
    }
}