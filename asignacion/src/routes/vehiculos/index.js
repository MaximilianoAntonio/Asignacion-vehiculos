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
        'automovil': 'Automóvil',
        'camioneta': 'Camioneta',
        'minibus': 'Minibús',
        'station_wagon': 'Station Wagon',
    };

    // Diccionario para mostrar los estados de vehículo de forma más legible
    const estadoVehiculoLabels = {
        'disponible': 'Disponible',
        'en_uso': 'En Ruta',
        'mantenimiento': 'Mantenimiento',
        'reservado': 'Reservado',
    };

    // Contar vehículos por estado
    const vehiculosPorEstado = vehiculos.reduce((acc, v) => {
        acc[v.estado] = (acc[v.estado] || 0) + 1;
        return acc;
    }, {});

    const renderTable = () => (
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Patente</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Año</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {vehiculos.map((vehiculo) => (
                        <tr key={vehiculo.id} class="slide-in-up">
                            <td data-label="Patente">{vehiculo.patente}</td>
                            <td data-label="Marca">{vehiculo.marca}</td>
                            <td data-label="Modelo">{vehiculo.modelo}</td>
                            <td data-label="Año">{vehiculo.anio}</td>
                            <td data-label="Estado">
                                <span class={`${style.statusBadge} ${style[vehiculo.estado]}`}>
                                    {estadoVehiculoLabels[vehiculo.estado] || vehiculo.estado}
                                </span>
                            </td>
                            <td data-label="Acciones">
                                <button onClick={() => handleViewDetails(vehiculo)} class="button button-outline" style={{ marginRight: '0.5rem' }}>Ver</button>
                                <button onClick={() => handleEdit(vehiculo)} class="button button-outline">Editar</button>
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
            <div class={style.modalOverlay} onClick={() => setDetailModalVehiculo(null)}>
                <div class={`${style.modalContent} card fade-in`} onClick={(e) => e.stopPropagation()}>
                    <button class={style.modalCloseButton} onClick={() => setDetailModalVehiculo(null)}>×</button>
                    <div class="card-header">
                        <h2 class="card-title">Información del Vehículo</h2>
                    </div>
                    <div class={style.modalBody}>
                        <div class={style.modalImageContainer}>
                            <img src={detailModalVehiculo.foto_url ? `${detailModalVehiculo.foto_url}` : 'https://th.bing.com/th/id/OIP.5_RqTlUhvMdpCjGOhOmTdQHaHa?rs=1&pid=ImgDetMain'} alt="Vehículo" />
                        </div>
                        <div class={style.modalDetails}>
                            <p><strong>Marca:</strong> {detailModalVehiculo.marca}</p>
                            <p><strong>Modelo:</strong> {detailModalVehiculo.modelo}</p>
                            <p><strong>Patente:</strong> {detailModalVehiculo.patente}</p>
                            <p><strong>Tipo:</strong> {tipoVehiculoLabels[detailModalVehiculo.tipo_vehiculo] || detailModalVehiculo.tipo_vehiculo}</p>
                            <p><strong>Año:</strong> {detailModalVehiculo.anio}</p>
                            <p><strong>Capacidad:</strong> {detailModalVehiculo.capacidad_pasajeros} pasajeros</p>
                            <p><strong>Número de Chasis:</strong> {detailModalVehiculo.numero_chasis || 'N/A'}</p>
                            <p><strong>Motor:</strong> {detailModalVehiculo.numero_motor || 'N/A'}</p>
                            <p><strong>Estado:</strong> <span class={`${style.statusBadge} ${style[detailModalVehiculo.estado]}`}>{estadoVehiculoLabels[detailModalVehiculo.estado] || detailModalVehiculo.estado}</span></p>
                        </div>
                    </div>
                    <div class={style.modalActions}>
                        <button onClick={() => handleEdit(detailModalVehiculo)} class="button button-primary">Editar</button>
                        <button onClick={() => handleDelete(detailModalVehiculo.id)} class="button button-danger">Eliminar</button>
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
                    <i class="fas fa-plus" style={{ marginRight: '0.5rem' }}></i> Nuevo Vehículo
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
                <div class={style.modalOverlay} onClick={resetFormState}>
                    <div class={`${style.modalContent} card fade-in`} onClick={e => e.stopPropagation()}>
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