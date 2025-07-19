// src/routes/dashboard/index.js
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getDashboardStats, refreshDashboardCache, calculateAdditionalMetrics } from '../../services/dashboardService';
import { getAsignaciones } from '../../services/asignacionService';
import VistaGeneral from '../../components/dashboard/VistaGeneral';
import VistaVehiculos from '../../components/dashboard/VistaVehiculos';
import VistaConductores from '../../components/dashboard/VistaConductores';
import VistaAsignaciones from '../../components/dashboard/VistaAsignaciones';
import VistaMapa from '../../components/dashboard/VistaMapa';
import FiltroTemporal from '../../components/dashboard/FiltroTemporal';
import style from './style.css';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [dashboardData, setDashboardData] = useState(null);
    const [asignaciones, setAsignaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [filtroTemporal, setFiltroTemporal] = useState({
        periodo: 'monthly',
        fecha_inicio: null,
        fecha_fin: null
    });

    // Cargar datos del dashboard
    const loadDashboardData = async (params = filtroTemporal) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDashboardStats(params);
            const additionalMetrics = calculateAdditionalMetrics(data);
            setDashboardData({ ...data, metricas: additionalMetrics });

            // Obtener asignaciones directamente
            const asignacionesData = await getAsignaciones({
                fecha_hora_requerida_inicio__gte: params.fecha_inicio,
                fecha_hora_requerida_inicio__lte: params.fecha_fin
            });
            setAsignaciones(asignacionesData);
        } catch (err) {
            console.error('Error cargando datos del dashboard:', err);
            setError('Error al cargar los datos del dashboard. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Refrescar caché
    const handleRefreshCache = async () => {
        try {
            setRefreshing(true);
            await refreshDashboardCache();
            await loadDashboardData();
        } catch (err) {
            console.error('Error refrescando caché:', err);
            setError('Error al refrescar los datos. Por favor, intente nuevamente.');
        } finally {
            setRefreshing(false);
        }
    };

    // Manejar cambio de filtro temporal
    const handleFiltroChange = (nuevoFiltro) => {
        setFiltroTemporal(nuevoFiltro);
        loadDashboardData(nuevoFiltro);
    };

    // Cargar datos iniciales
    useEffect(() => {
        loadDashboardData();
    }, []);

    const tabs = [
        { id: 'general', label: 'Vista General', icon: '📊' },
        { id: 'asignaciones', label: 'Asignaciones', icon: '📋' },
        { id: 'vehiculos', label: 'Vehículos', icon: '🚗' },
        { id: 'conductores', label: 'Conductores', icon: '👨‍💼' },
        { id: 'mapa', label: 'Mapa', icon: '🗺️' }
    ];

    const renderContent = () => {
        if (loading && !dashboardData) {
            return (
                <div className={style.loadingContainer}>
                    <div className={style.spinner}></div>
                    <p>Cargando datos del dashboard...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className={style.errorContainer}>
                    <div className={style.errorMessage}>
                        <h3>⚠️ Error</h3>
                        <p>{error}</p>
                        <button 
                            onClick={() => loadDashboardData()}
                            className={style.retryButton}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'general':
                return <VistaGeneral data={dashboardData} loading={loading} />;
            case 'asignaciones':
                return <VistaAsignaciones data={dashboardData} loading={loading} filtro={filtroTemporal} />;
            case 'vehiculos':
                return <VistaVehiculos data={dashboardData} loading={loading} filtro={filtroTemporal} />;
            case 'conductores':
                return <VistaConductores data={dashboardData} loading={loading} filtro={filtroTemporal} />;
            case 'mapa':
                return (
                    <VistaMapa 
                        vehiculos={dashboardData?.vehiculos || []}
                        conductores={dashboardData?.conductores || []}
                        asignaciones={asignaciones}
                        filtros={filtroTemporal}
                        onFiltrosChange={setFiltroTemporal}
                    />
                );
            default:
                return <VistaGeneral data={dashboardData} loading={loading} />;
        }
    };

    return (
        <div className={style.dashboard}>
            {/* Header del Dashboard */}
            <div className={style.header}>
                <div className={style.titleSection}>
                    <h1>Dashboard de Mantenimiento</h1>
                    <p>Sistema de gestión de flota vehicular</p>
                </div>
                
                <div className={style.controls}>
                    <FiltroTemporal 
                        filtro={filtroTemporal}
                        onChange={handleFiltroChange}
                    />
                    
                    <button 
                        onClick={handleRefreshCache}
                        disabled={refreshing}
                        className={style.refreshButton}
                        title="Actualizar datos"
                    >
                        {refreshing ? '🔄' : '🔄'} 
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Navegación por pestañas */}
            <div className={style.tabNavigation}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${style.tab} ${activeTab === tab.id ? style.activeTab : ''}`}
                    >
                        <span className={style.tabIcon}>{tab.icon}</span>
                        <span className={style.tabLabel}>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Contenido principal */}
            <div className={style.content}>
                {renderContent()}
            </div>

            {/* Indicador de carga global */}
            {loading && dashboardData && (
                <div className={style.loadingOverlay}>
                    <div className={style.loadingIndicator}>
                        <div className={style.spinner}></div>
                        <span>Actualizando datos...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
