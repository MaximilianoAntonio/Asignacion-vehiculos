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

    return (
        <div class={style.vehiculosPage}>
            <h1>Gestión de Vehículos</h1>
            
            {/* Contadores por estado */}
            <div class={style.estadoCounters}>
                <span class={style.estadoDisponible}>
                    Disponible: {vehiculosPorEstado['disponible'] || 0}
                </span>
                <span class={style.estadoEnUso}>
                    En Ruta: {vehiculosPorEstado['en_uso'] || 0}
                </span>
                <span class={style.estadoReservado}>
                    Reservado: {vehiculosPorEstado['reservado'] || 0}
                </span>
                <span class={style.estadoMantenimiento}>
                    Mantenimiento: {vehiculosPorEstado['mantenimiento'] || 0}
                </span>
            </div>

            <div class={style.pageLayout}>

                <div class={style.leftColumn}>
                    <button onClick={handleAddNew} class={style.button}>
                        Agregar Nuevo Vehículo
                    </button>
                    <div class={style.responsiveTableWrapper}>
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
                                      <td data-label="Patente">{vehiculo.patente}</td>
                                      <td data-label="Foto">
                                        {vehiculo.foto_url ? (
                                          <img
                                            src={`${vehiculo.foto_url}`}
                                            style={{ width: '100px', height: 'auto', objectFit: 'contain' }}
                                            />
                                        ) : (
                                          'Sin foto'
                                        )}
                                      </td>
                                      <td data-label="Marca">{vehiculo.marca}</td>
                                      <td data-label="Modelo">{vehiculo.modelo}</td>
                                      <td data-label="Año">{vehiculo.anio}</td>
                                      <td data-label="Tipo">{tipoVehiculoLabels[vehiculo.tipo_vehiculo] || vehiculo.tipo_vehiculo}</td>
                                      <td data-label="Estado" class={
                                          vehiculo.estado === 'disponible' ? style.estadoDisponible :
                                          vehiculo.estado === 'en_uso' ? style.estadoEnUso :
                                          vehiculo.estado === 'mantenimiento' ? style.estadoMantenimiento :
                                          vehiculo.estado === 'reservado' ? style.estadoReservado : ''
                                      }>
                                          {estadoVehiculoLabels[vehiculo.estado] || vehiculo.estado}
                                      </td>
                                      <td data-label="Capacidad">{vehiculo.capacidad_pasajeros}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                </div>

            </div>

            {/* MODAL flotante para el formulario */}
            {formMode && (
              <div class={style.modalOverlay} onClick={resetFormState}>
                <div class={style.modalContent} onClick={e => e.stopPropagation()}>
                  <VehiculoForm
                    vehiculo={selectedVehiculo}
                    onSave={handleSave}
                    onUpdate={handleUpdate}
                    onCancel={resetFormState}
                  />
                </div>
              </div>
            )}

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