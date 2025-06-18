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
import HorariosPage from '../routes/horarios'; // Importa la ruta de horarios
import MantenimientoPage from '../routes/mantenimiento'; // 1. Importar la nueva página
import CamaraPage from '../routes/camara/index'; // Nueva importación


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
        userGroup: JSON.parse(localStorage.getItem('userGroup') || '[]'), // <-- SIEMPRE array
    };

    componentDidMount() {
        this.setState({ 
            isLoggedIn: !!getToken(),
            userGroup: JSON.parse(localStorage.getItem('userGroup') || '[]'), // <-- SIEMPRE array
        });

    }

    handleRoute = e => {
        this.currentUrl = e.url;
        this.setState({ 
            currentUrl: e.url, 
            isLoggedIn: !!getToken(),
            userGroup: JSON.parse(localStorage.getItem('userGroup') || '[]'), // <-- SIEMPRE array
        });
    };

    handleLogout = () => {
        logoutUser();
        localStorage.removeItem('userGroup');
        this.setState({ isLoggedIn: false, userGroup: [] }); // <-- array vacío
        route('/login', true);
    };

    render() {
        return (
            <div id="app">
                <Header 
                    isLoggedIn={this.state.isLoggedIn} 
                    onLogout={this.handleLogout}
                    userGroup={this.state.userGroup} // <-- Ahora es array
                />
                <Router onChange={this.handleRoute}>
                    <Home path="/" />
                    <LoginPage path="/login" />
                    <PrivateRoute component={VehiculosPage} path="/vehiculos" />
                    <PrivateRoute component={ConductoresPage} path="/conductores" />
                    <PrivateRoute component={AsignacionesPage} path="/asignaciones" userGroup={this.state.userGroup} />
                    <PrivateRoute component={HorariosPage} path="/horarios" />
                    <PrivateRoute component={MantenimientoPage} path="/mantenimiento" />
                    <PrivateRoute component={CamaraPage} path="/camara" />
                </Router>
            </div>
        );
    }
}