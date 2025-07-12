import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import VehiculoForm from '../../components/vehiculoForm';
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from '../../services/vehicleService';
import style from './style.css';

const Vehiculos = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedVehiculo, setSelectedVehiculo] = useState(null);
    const [detailModalVehiculo, setDetailModalVehiculo] = useState(null);
    const [formMode, setFormMode] = useState(null);

    useEffect(() => {
        loadVehiculos();
    }, []);

    const loadVehiculos = async () => {
        try {
            const data = await getVehiculos();
            setVehiculos(data);
        } catch (error) {
            console.error("Error al cargar vehículos:", error);
        }
    };

    const resetFormState = () => {
        setFormMode(null);
        setSelectedVehiculo(null);
    };

    const handleSave = async (formData) => {
        try {
            await createVehiculo(formData);
            loadVehiculos();
            resetFormState();
        } catch (error) {
            console.error("Error al crear vehículo:", error.response?.data || error.message);
            alert('Error al guardar el vehículo.');
        }
    };

    const handleUpdate = async (id, formData) => {
        try {
            await updateVehiculo(id, formData);
            loadVehiculos();
            resetFormState();
        } catch (error) {
            console.error("Error al actualizar vehículo:", error.response?.data || error.message);
            alert('Error al actualizar el vehículo.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
            try {
                await deleteVehiculo(id);
                loadVehiculos();
                setDetailModalVehiculo(null);
            } catch (error) {
                console.error("Error al eliminar vehículo:", error);
                alert('Error al eliminar el vehículo.');
            }
        }
    };

    const handleEdit = (vehiculo) => {
        setDetailModalVehiculo(null);
        setSelectedVehiculo(vehiculo);
        setFormMode('edit');
    };

    const handleAddNew = () => {
        setSelectedVehiculo(null);
        setFormMode('add');
    };

    const handleViewDetails = (vehiculo) => {
        setDetailModalVehiculo(vehiculo);
    };
    


    // Diccionario para mostrar los tipos de vehículo de forma más legible
    const tipoVehiculoLabels = {
        automovil: 'Automóvil',
        camioneta: 'Camioneta',
        minibus: 'Minibús',
        station_wagon: 'Station Wagon',
    };

    // Diccionario para mostrar los estados de vehículo de forma más legible
    const estadoVehiculoLabels = {
        disponible: 'Disponible',
        en_uso: 'En Ruta',
        mantenimiento: 'Mantenimiento',
        reservado: 'Reservado',
    };

    // Contar vehículos por estado
    const vehiculosPorEstado = vehiculos.reduce((acc, v) => {
        acc[v.estado] = (acc[v.estado] || 0) + 1;
        return acc;
    }, {});

    const renderTable = () => (
        <div class="table-container">
            {/* Tip informativo */}
            <div class={style.tableTip}>
                <i class="fas fa-info-circle"></i>
                <span>Haz clic en cualquier fila para ver los detalles del vehículo y editarlo</span>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Año</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {vehiculos.map((vehiculo) => (
                        <tr 
                            key={vehiculo.id} 
                            class={`slide-in-up ${style.clickableRow}`}
                            onClick={() => handleViewDetails(vehiculo)}
                            title="Haz clic para ver detalles y editar"
                        >
                            <td data-label="Patente">{vehiculo.patente}</td>
                            <td data-label="Marca">{vehiculo.marca}</td>
                            <td data-label="Modelo">{vehiculo.modelo}</td>
                            <td data-label="Año">{vehiculo.anio}</td>
                            <td data-label="Estado">
                                <span class={`${style.statusBadge} ${style[vehiculo.estado]}`}>
                                    {estadoVehiculoLabels[vehiculo.estado] || vehiculo.estado}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderDetailModal = () => {
        if (!detailModalVehiculo) return null;

        return (
            <div class="modal-overlay" onClick={() => setDetailModalVehiculo(null)}>
                <div class="modal-content card" onClick={(e) => e.stopPropagation()}>
                    <div class="card-header">
                        <h2 class="card-title">Información del Vehículo</h2>
                        <button class="modal-close-btn" onClick={() => setDetailModalVehiculo(null)}>×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="modal-sections">
                            <div class="modal-image-section">
                                <img 
                                    src={detailModalVehiculo.foto_url ? `${detailModalVehiculo.foto_url}` : '/assets/no-camera.png'} 
                                    alt="Vehículo" 
                                    class="vehicle-image"
                                />
                            </div>
                            
                            <div class="modal-info-section">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Marca:</span>
                                        <span class="info-value">{detailModalVehiculo.marca}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Modelo:</span>
                                        <span class="info-value">{detailModalVehiculo.modelo}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Patente:</span>
                                        <span class="info-value">{detailModalVehiculo.patente}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Tipo:</span>
                                        <span class="info-value">{tipoVehiculoLabels[detailModalVehiculo.tipo_vehiculo] || detailModalVehiculo.tipo_vehiculo}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Año:</span>
                                        <span class="info-value">{detailModalVehiculo.anio}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Capacidad:</span>
                                        <span class="info-value">{detailModalVehiculo.capacidad_pasajeros} pasajeros</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Número de Chasis:</span>
                                        <span class="info-value">{detailModalVehiculo.numero_chasis || 'N/A'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Motor:</span>
                                        <span class="info-value">{detailModalVehiculo.numero_motor || 'N/A'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Estado:</span>
                                        <span class={`status-badge ${detailModalVehiculo.estado}`}>
                                            {estadoVehiculoLabels[detailModalVehiculo.estado] || detailModalVehiculo.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions" style="display: flex; justify-content: space-between;">
                        <button onClick={() => handleDelete(detailModalVehiculo.id)} class="button button-danger">Eliminar</button>
                        <button onClick={() => handleEdit(detailModalVehiculo)} class="button button-primary">Editar</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">Gestión de Vehículos</h1>
                <button onClick={handleAddNew} class="button button-primary">
                    <i class="fas fa-plus" style={{ marginRight: '0.5rem' }} /> Nuevo Vehículo
                </button>
            </div>

            <div class={style.statsContainer}>
                <div class={style.statCard}>
                    <h3>Disponibles</h3>
                    <p>{vehiculosPorEstado['disponible'] || 0}</p>
                </div>
                <div class={style.statCard}>
                    <h3>En Ruta</h3>
                    <p>{vehiculosPorEstado['en_uso'] || 0}</p>
                </div>
                <div class={style.statCard}>
                    <h3>Reservados</h3>
                    <p>{vehiculosPorEstado['reservado'] || 0}</p>
                </div>
                <div class={style.statCard}>
                    <h3>Mantenimiento</h3>
                    <p>{vehiculosPorEstado['mantenimiento'] || 0}</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Lista de Vehículos</h2>
                </div>
                {renderTable()}
            </div>

            {formMode && (
                <div class="modal-overlay" onClick={resetFormState}>
                    <div class="modal-content card" onClick={e => e.stopPropagation()}>
                        <VehiculoForm
                            vehiculo={selectedVehiculo}
                            onSave={handleSave}
                            onUpdate={handleUpdate}
                            onCancel={resetFormState}
                        />
                    </div>
                </div>
            )}

            {renderDetailModal()}
        </div>
    );
};

export default Vehiculos;