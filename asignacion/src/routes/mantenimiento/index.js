import { h, Component } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getVehiculos } from '../../services/vehicleService';
import style from './style.css';

const MANTENIMIENTO_INTERVALO_KM = 10000; // Mantenimiento cada 10.000 km

const MantenimientoPage = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getVehiculos();
                setVehiculos(data);
                setError(null);
            } catch (err) {
                setError('Error al cargar los datos de mantenimiento.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const calcularMantenimiento = (kilometraje) => {
        if (typeof kilometraje !== 'number') {
            return { proximo: 'N/A', progreso: 0, restante: 'N/A' };
        }
        const km = Math.round(kilometraje);
        const proximo = Math.ceil(km / MANTENIMIENTO_INTERVALO_KM) * MANTENIMIENTO_INTERVALO_KM;
        const ultimo = proximo - MANTENIMIENTO_INTERVALO_KM;
        const progreso = ((km - ultimo) / MANTENIMIENTO_INTERVALO_KM) * 100;
        const restante = proximo - km;
        return {
            proximo: proximo.toLocaleString('es-ES'),
            progreso: Math.max(0, Math.min(100, progreso)),
            restante: restante.toLocaleString('es-ES'),
        };
    };

    if (loading) return <p>Cargando vehículos...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div class={style.mantenimientoPage}>
            <h1>Control de Mantenimiento de Vehículos</h1>
            <p>El mantenimiento preventivo se recomienda cada <strong>{MANTENIMIENTO_INTERVALO_KM.toLocaleString('es-ES')} km</strong>.</p>
            
            <table class={style.mantenimientoTable}>
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Marca / Modelo</th>
                        <th>Kilometraje Actual</th>
                        <th>Próximo Mantenimiento (km)</th>
                        <th>Progreso</th>
                        <th>Km Restantes</th>
                    </tr>
                </thead>
                <tbody>
                    {vehiculos.map(v => {
                        const mant = calcularMantenimiento(v.kilometraje);
                        return (
                            <tr key={v.id}>
                                <td>{v.patente}</td>
                                <td>{v.marca} {v.modelo}</td>
                                <td>{v.kilometraje ? `${Math.round(v.kilometraje).toLocaleString('es-ES')} km` : 'N/A'}</td>
                                <td>{mant.proximo}</td>
                                <td>
                                    <div class={style.progressBarContainer}>
                                        <div 
                                            class={style.progressBar} 
                                            style={{ width: `${mant.progreso}%` }}
                                        />
                                        <span class={style.progressText}>{Math.round(mant.progreso)}%</span>
                                    </div>
                                </td>
                                <td>{mant.restante} km</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default MantenimientoPage;
