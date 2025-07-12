// src/components/app.js
import { h, Component } from 'preact';
import { Router, route } from 'preact-router'; // Importa route
import { getToken, logoutUser } from '../services/authService'; // Importa funciones de auth
import { lazy, Suspense } from 'preact/compat';

import Header from './header';
import Home from '../routes/home';
import LoginPage from '../routes/login'; // Mantener login cargado inmediatamente

// Lazy loading para rutas pesadas
const AsignacionesPage = lazy(() => import('../routes/asignaciones'));
const VehiculosPage = lazy(() => import('../routes/vehiculos'));
const ConductoresPage = lazy(() => import('../routes/conductores'));
const MantenimientoPage = lazy(() => import('../routes/mantenimiento'));
const CamaraPage = lazy(() => import('../routes/camara/index'));
const MasInformacionPage = lazy(() => import('../routes/mas-informacion'));

// Componente de loading
const Loading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    fontSize: '1.1rem',
    color: '#6c757d'
  }}>
    Cargando...
  </div>
);


// Componente wrapper para la página de Más Información
const MasInformacionRoute = () => (
    <Suspense fallback={<Loading />}>
        <MasInformacionPage />
    </Suspense>
);
const PrivateRoute = ({ component: Comp, ...props }) => {
    if (!getToken()) {
        route('/login', true); // Redirige a login si no hay token
        return null; // Evita renderizar el componente protegido
    }
    return (
        <Suspense fallback={<Loading />}>
            <Comp {...props} />
        </Suspense>
    );
};


export default class App extends Component {
    state = {
        currentUrl: '',
        isLoggedIn: !!getToken(),
        userGroup: JSON.parse(localStorage.getItem('userGroup') || '[]'), // <-- SIEMPRE array
    };

    componentDidMount() {
        // Establecer el título de la página
        document.title = 'Sistema de Gestión Vehicular - SSVQ';
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
                <main class="page-content">
                    <Router onChange={this.handleRoute}>
                        <Home path="/" />
                        <LoginPage path="/login" onLoginSuccess={this.handleLogin} />
                        <PrivateRoute component={VehiculosPage} path="/vehiculos" />
                        <PrivateRoute component={ConductoresPage} path="/conductores" />
                        <PrivateRoute component={AsignacionesPage} path="/asignaciones" userGroup={this.state.userGroup} />
                        <PrivateRoute component={MantenimientoPage} path="/mantenimiento" />
                        <PrivateRoute component={CamaraPage} path="/camara" />
                        <MasInformacionRoute path="/mas-informacion" />
                    </Router>
                </main>
            </div>
        );
    }
}