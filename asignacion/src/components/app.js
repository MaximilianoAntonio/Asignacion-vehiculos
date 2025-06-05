import { h, Component } from 'preact';
import { Router, route, Link } from 'preact-router';
import AsyncRoute from 'preact-async-route';

// Componente Header
import Header from './header'; // Asegúrate que Header esté en el mismo directorio o ajusta la ruta

// Importar funciones del servicio de autenticación
// Asegúrate que authService.js exporte estas funciones correctamente.
import { 
    isAuthenticated, 
    isSolicitante, 
    isAdminOrStaff, 
    logout, // Usar 'logout' en lugar de 'logoutUser'
    getUserInfo,
    fetchUserDetails // Necesario para cargar detalles del usuario y roles
} from '../services/authService';

export default class App extends Component {
    state = {
        currentUrl: '/',
        isLoggedIn: false,
        userIsSolicitante: false,
        userIsAdmin: false,
        userName: '',
        isLoadingUserDetails: true, // Para manejar la carga inicial de detalles del usuario
    };

    componentDidMount() {
        // Sincronizar la URL actual al cargar
        if (typeof window !== 'undefined') {
            this.setState({ currentUrl: window.location.pathname });
            // Escuchar cambios en el estado de autenticación
            window.addEventListener('authChange', this.updateAuthStateAndFetchDetails);
        }
        // Cargar estado de autenticación y detalles del usuario al inicio
        this.updateAuthStateAndFetchDetails();
    }

    componentWillUnmount() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('authChange', this.updateAuthStateAndFetchDetails);
        }
    }

    // Actualiza el estado de autenticación y obtiene detalles del usuario
    updateAuthStateAndFetchDetails = async () => {
        this.setState({ isLoadingUserDetails: true });
        const loggedIn = isAuthenticated();
        let userInfo = null;
        let userName = '';
        let userIsSolicitanteRole = false; // Renombrar para evitar conflicto con la función importada
        let userIsAdminRole = false;       // Renombrar para evitar conflicto con la función importada
        
        if (loggedIn) {
            userInfo = getUserInfo(); // Intentar obtener de localStorage primero
            if (!userInfo) { // Si no está en localStorage, o si queremos refrescar
                console.log("App.js: No user info in localStorage, fetching from server...");
                userInfo = await fetchUserDetails(); // Llama al backend
            }
            
            if (userInfo) {
                console.log("App.js: User details processed:", userInfo);
                userName = userInfo.full_name || userInfo.username || 'Usuario';
                // Calcular roles basados en la información del usuario (especialmente los grupos)
                const groups = Array.isArray(userInfo.groups) ? userInfo.groups : [];
                userIsSolicitanteRole = groups.includes('Solicitantes de Traslados');
                userIsAdminRole = (userInfo.is_staff || userInfo.is_superuser) || (!userIsSolicitanteRole && loggedIn);
            } else {
                console.warn("App.js: User is authenticated (token exists) but details could not be fetched or are null.");
                // Si no se pueden obtener detalles, los roles serán false.
                // Podrías querer forzar un logout si los detalles son cruciales y no se pueden obtener.
                // await logout(); // Descomentar para forzar logout si los detalles son indispensables
            }
        } else {
             console.log("App.js: User is not authenticated.");
        }

        this.setState({
            isLoggedIn: loggedIn,
            userIsSolicitante: userIsSolicitanteRole,
            userIsAdmin: userIsAdminRole,
            userName: userName,
            isLoadingUserDetails: false,
        });
    };
    
    // Manejador para cambios de ruta desde el Router
    handleRoute = e => {
        this.setState({ currentUrl: e.url });
        // Opcional: se podría llamar a updateAuthStateAndFetchDetails aquí si ciertas rutas
        // requieren una revalidación inmediata, pero 'authChange' debería ser suficiente.
    };

    // Manejador para el logout
    handleLogout = async () => {
        this.setState({isLoadingUserDetails: true}); // Mostrar carga durante el logout
        await logout(); // Llamar a la función 'logout' importada de authService
        // authService.logout ya debería disparar 'authChange', lo que actualiza el estado.
        // Redirigir explícitamente a login.
        route('/login', true); 
        // El estado se actualizará a través del listener de 'authChange'
    };

    // Funciones para cargar componentes de ruta de forma asíncrona (code splitting)
    loadHome = () => import('../routes/home').then(module => module.default || module);
    loadLogin = () => import('../routes/login').then(module => module.default || module);
    loadProfile = () => import('../routes/profile').then(module => module.default || module);
    loadVehiculosPage = () => import('../routes/vehiculos').then(module => module.default || module);
    loadConductoresPage = () => import('../routes/conductores').then(module => module.default || module);
    loadAsignacionesPage = () => import('../routes/asignaciones').then(module => module.default || module);
    loadSolicitarTrasladoPage = () => import('../routes/solicitar-traslado').then(module => module.default || module);
    // Podrías crear un componente NotFoundPage para rutas no encontradas
    // loadNotFound = () => import('../routes/notfound').then(module => module.default || module);

    render(_, { isLoggedIn, userIsSolicitante, userIsAdmin, userName, isLoadingUserDetails, currentUrl }) {
        // Mostrar un indicador de carga global si se están cargando los detalles del usuario y está autenticado
        if (isLoadingUserDetails && isAuthenticated() && currentUrl !== '/login') { 
            return (
                <div id="app">
                    <Header 
                        loggedIn={true} // Podría ser true pero indicando carga
                        isSolicitante={false} 
                        isAdmin={false}
                        userName="" // Vacío mientras carga
                        onLogout={this.handleLogout}
                    />
                    <main class="main-content" style={{ textAlign: 'center', padding: '50px', color: '#333' }}>
                        <p style={{fontSize: '1.2em'}}>Cargando datos del usuario...</p>
                        {/* Podrías agregar un spinner CSS aquí */}
                    </main>
                </div>
            );
        }

        return (
            <div id="app">
                <Header 
                    loggedIn={isLoggedIn} 
                    isSolicitante={userIsSolicitante} 
                    isAdmin={userIsAdmin}
                    userName={userName}
                    onLogout={this.handleLogout}
                />
                <main class="main-content" style={{ paddingTop: '20px' }}> {/* Añadir padding si el header es fixed */}
                    <Router onChange={this.handleRoute} url={currentUrl}> {/* Asegurar que el router usa currentUrl */}
                        <AsyncRoute path="/" getComponent={this.loadHome} />
                        
                        {/* Si no está logueado, solo mostrar la ruta de login */}
                        {!isLoggedIn && <AsyncRoute path="/login" getComponent={this.loadLogin} />}
                        {/* Si está logueado, no mostrar /login directamente, redirigir desde el componente Login si es necesario */}
                        
                        {/* Rutas disponibles solo si está logueado */}
                        {isLoggedIn && (
                            <AsyncRoute path="/profile" getComponent={this.loadProfile} />
                        )}

                        {/* Rutas específicas para Solicitantes */}
                        {isLoggedIn && userIsSolicitante && (
                            <AsyncRoute path="/solicitar-traslado" getComponent={this.loadSolicitarTrasladoPage} />
                            // Ejemplo: <AsyncRoute path="/mis-solicitudes" getComponent={this.loadMisSolicitudesPage} />
                        )}

                        {/* Rutas específicas para Admins/Staff */}
                        {isLoggedIn && userIsAdmin && (
                            <>
                                <AsyncRoute path="/vehiculos" getComponent={this.loadVehiculosPage} />
                                <AsyncRoute path="/conductores" getComponent={this.loadConductoresPage} />
                                <AsyncRoute path="/asignaciones" getComponent={this.loadAsignacionesPage} />
                                {/* Un admin también podría tener acceso a solicitar, si es necesario */}
                                {/* <AsyncRoute path="/solicitar-traslado" getComponent={this.loadSolicitarTrasladoPage} /> */}
                            </>
                        )}
                        
                        {/* Fallback para rutas no encontradas */}
                        <div default class="route-not-found" style={{ padding: '40px 20px', textAlign: 'center', color: '#555' }}>
                            <h2>Error 404 - Página No Encontrada</h2>
                            <p>Lo sentimos, la página que buscas no existe o no tienes permiso para acceder a ella.</p>
                            <Link href="/" class="link-to-home" style={{color: '#007bff', textDecoration: 'none'}}>Volver a la página de inicio</Link>
                        </div>
                    </Router>
                </main>
            </div>
        );
    }
}