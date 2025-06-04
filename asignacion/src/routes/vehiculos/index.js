import { h, Component } from 'preact';
import { getVehiculos, createVehiculo, deleteVehiculo } from '../../services/vehicleService';
import style from './style.css';
import VehiculoForm from '../../components/vehiculoForm';

class VehiculosPage extends Component {
  state = {
    vehiculos: [],
    loading: true,
    error: null,
    showForm: false,
    vehiculoEditando: null,
  };

  componentDidMount() {
    this.cargarVehiculos();
  }

  cargarVehiculos = () => {
    this.setState({ loading: true });
    getVehiculos()
      .then(response => {
        this.setState({
          vehiculos: response.data.results || response.data,
          loading: false,
          error: null,
        });
      })
      .catch(error => {
        console.error("Error fetching vehiculos:", error);
        this.setState({ error: 'Error al cargar los vehículos.', loading: false });
      });
  };

  handleShowForm = () => {
    this.setState({ showForm: true, vehiculoEditando: null });
  };

  handleHideForm = () => {
    this.setState({ showForm: false, vehiculoEditando: null });
  };

  handleVehiculoCreado = () => {
    this.setState({ showForm: false, vehiculoEditando: null });
    this.cargarVehiculos();
  };

  handleEditVehiculo = (vehiculo) => {
    this.setState({ showForm: true, vehiculoEditando: vehiculo });
  };

  handleDeleteVehiculo = (vehiculo) => {
    const confirmado = window.confirm(`¿Estás seguro de que deseas eliminar el vehículo con patente ${vehiculo.patente}?`);
    if (confirmado) {
      deleteVehiculo(vehiculo.id)
        .then(() => this.cargarVehiculos())
        .catch(error => {
          console.error('Error al eliminar el vehículo:', error);
          alert('Ocurrió un error al eliminar el vehículo.');
        });
    }
  };

  render(_, { vehiculos, loading, error, showForm }) {
    if (loading) return <p>Cargando vehículos...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
      <div class={`${style.panelLayout} ${showForm ? style.withForm : ''}`}>
        <div class={style.dataTableContainer}>
          <div class={style.encabezado}>
            <h1>Listado de Vehículos</h1>
            <button onClick={this.handleShowForm} class={style.addButton}>Agregar Vehículo</button>
          </div>
          <div class={style.tableContainer}>
            {vehiculos.length === 0 ? (
              <p>No hay vehículos registrados.</p>
            ) : (
              <table class={style.dataTable}>
                <thead>
                  <tr>
                    <th>Patente</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Año</th>
                    <th>Tipo</th>
                    <th>Pasajeros</th>
                    <th>Estado</th>
                    <th>Chasis</th>
                    <th>Motor</th>
                    <th>Conductor Preferente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map(v => (
                    <tr key={v.id}>
                      <td>{v.patente}</td>
                      <td>{v.marca}</td>
                      <td>{v.modelo}</td>
                      <td>{v.anio || '—'}</td>
                      <td>{v.tipo_vehiculo}</td>
                      <td>{v.capacidad_pasajeros}</td>
                      <td>{v.estado}</td>
                      <td>{v.numero_chasis || '—'}</td>
                      <td>{v.numero_motor || '—'}</td>
                      <td>{v.conductor_preferente ? `${v.conductor_preferente.nombre} ${v.conductor_preferente.apellido}` : '—'}</td>
                      <td>
                        <button onClick={() => this.handleEditVehiculo(v)} class={style.editButton}>✏️ Editar</button>
                        <button onClick={() => this.handleDeleteVehiculo(v)} class={style.deleteButton}>🗑️ Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showForm && (
          <div class={style.formPanel}>
            <VehiculoForm
              vehiculo={this.state.vehiculoEditando}
              onVehiculoCreado={this.handleVehiculoCreado}
              onCancel={this.handleHideForm}
            />
          </div>
        )}
      </div>
    );
  }
}

export default VehiculosPage;

