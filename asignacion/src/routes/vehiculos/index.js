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
    
    const API_BASE_URL = 'http://127.0.0.1:8000/';

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

    return (
        <div class={style.vehiculosPage}>
            <h1>Gestión de Vehículos</h1>
            
            <div class={style.pageLayout}>
                <div class={style.leftColumn}>
                    <button onClick={handleAddNew} class={style.button}>
                        Agregar Nuevo Vehículo
                    </button>
                    <table class={style.table}>
                        <thead>
                            <tr>
                                <th>Patente</th>
                                <th>Foto</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Año</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Capacidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.map((vehiculo) => (
                                <tr key={vehiculo.id} onClick={() => handleViewDetails(vehiculo)} class={style.clickableRow}>
                                    <td>{vehiculo.patente}</td>
                                    <td>
                                      {vehiculo.foto_url ? (
                                        <img
                                          src={`${vehiculo.foto_url}`}
                                          style={{ width: '100px', height: 'auto', objectFit: 'contain' }}
                                          />
                                      ) : (
                                        'Sin foto'
                                      )}
                                    </td>
                                    <td>{vehiculo.marca}</td>
                                    <td>{vehiculo.modelo}</td>
                                    <td>{vehiculo.anio}</td>
                                    <td>{tipoVehiculoLabels[vehiculo.tipo_vehiculo] || vehiculo.tipo_vehiculo}</td>
                                    <td>{estadoVehiculoLabels[vehiculo.estado] || vehiculo.estado}</td>
                                    <td>{vehiculo.capacidad_pasajeros}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div class={style.rightColumn}>
                    {formMode ? (
                        <div class={style.formContainer}>
                            <h2>{formMode === 'edit' ? 'Editar Vehículo' : 'Agregar Vehículo'}</h2>
                            <VehiculoForm 
                                vehiculo={selectedVehiculo} 
                                onSave={handleSave} 
                                onUpdate={handleUpdate}
                                onCancel={resetFormState}
                            />
                        </div>
                    ) : (
                        <div class={style.formPlaceholder}>
                            <p>Seleccione "Agregar Nuevo Vehículo" o haga clic en una fila para ver sus detalles y editar.</p>
                        </div>
                    )}
                </div>
            </div>

            {detailModalVehiculo && (
                 <div class={style.modalOverlay} onClick={() => setDetailModalVehiculo(null)}>
                    <div class={style.modalContent} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <div class={style.modalImageContainer} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <img src={detailModalVehiculo.foto_url ? `${detailModalVehiculo.foto_url}` : 'https://th.bing.com/th/id/OIP.5_RqTlUhvMdpCjGOhOmTdQHaHa?rs=1&pid=ImgDetMain'} alt="Vehículo" style={{ width: '250px', height: 'auto', objectFit: 'contain', display: 'block' }} />
                        </div>
                        <div style={{ flex: '1 1 0%' }}>
                            <button class={style.modalCloseButton} onClick={() => setDetailModalVehiculo(null)}>×</button>
                            <h2>Información del Vehículo</h2>
                            <div class={style.modalDetails}>
                                <p><strong>Marca:</strong> {detailModalVehiculo.marca}</p>
                                <p><strong>Modelo:</strong> {detailModalVehiculo.modelo}</p>
                                <p><strong>Patente:</strong> {detailModalVehiculo.patente}</p>
                                <p><strong>Tipo:</strong> {tipoVehiculoLabels[detailModalVehiculo.tipo_vehiculo] || detailModalVehiculo.tipo_vehiculo}</p>
                                <p><strong>Año:</strong> {detailModalVehiculo.anio}</p>
                                <p><strong>Capacidad:</strong> {detailModalVehiculo.capacidad_pasajeros} pasajeros</p>
                                <p><strong>Número de Chasis:</strong> {detailModalVehiculo.numero_chasis || 'N/A'}</p>
                                <p><strong>Motor:</strong> {detailModalVehiculo.numero_motor || 'N/A'}</p>
                                <p><strong>Estado:</strong> {estadoVehiculoLabels[detailModalVehiculo.estado] || detailModalVehiculo.estado}</p>
                            </div>
                            <div class={style.modalActions}>
                                <button onClick={() => handleEdit(detailModalVehiculo)} class={style.editButton}>Editar</button>
                                <button onClick={() => handleDelete(detailModalVehiculo.id)} class={style.deleteButton}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default Vehiculos;