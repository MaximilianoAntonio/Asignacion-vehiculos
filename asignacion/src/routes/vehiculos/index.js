// src/routes/vehiculos/index.js
import { h, Component } from 'preact';
import { getVehiculos } from '../../services/vehicleService';
import style from './style.css';
import VehiculoForm from '../../components/vehiculoForm'; // Importar el formulario
import { deleteVehiculo } from '../../services/vehicleService';

class VehiculosPage extends Component {
  state = {
    vehiculos: [],
    loading: true,
    error: null,
    showForm: false,
    selectedImage: null,
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
        this.setState({
          error: 'Error al cargar los vehículos.',
          loading: false
        });
      });
  }

  handleShowForm = () => {
    this.setState({ showForm: true });
  }
  
  handleHideForm = () => {
    this.setState({ showForm: false, vehiculoEditando: null });
  }
  
  handleVehiculoCreado = () => {
    this.setState({ showForm: false, vehiculoEditando: null });
    this.cargarVehiculos();
  }

  handleImageClick = (url) => {
    this.setState({ selectedImage: url });
  }

  handleCloseImage = () => {
    this.setState({ selectedImage: null });
  }

  handleEditVehiculo = (vehiculo) => {
    this.setState({
      showForm: true,
      vehiculoEditando: vehiculo
    });
  };

  handleDeleteVehiculo = (vehiculo) => {
    const confirmado = window.confirm(`¿Estás seguro de que deseas eliminar el vehículo ${vehiculo.patente}?`);
    if (confirmado) {
      deleteVehiculo(vehiculo.id)
        .then(() => this.cargarVehiculos())
        .catch(error => {
          console.error('Error al eliminar el vehículo:', error);
          alert('Ocurrió un error al eliminar el vehículo.');
        });
    }
  };

  render(_, { vehiculos, loading, error, showForm, selectedImage }) {
    if (loading && !showForm) {
      return <p>Cargando vehículos...</p>;
    }

    if (error && !showForm) {
      return <p style={{ color: 'red' }}>{error}</p>;
    }

    return (
      <div className={style.vehiculosPage}>
        <div className={style.encabezado}>
          <h1>Listado de Vehículos</h1>
          <button onClick={this.handleShowForm} className={style.addButton}>Agregar Vehículo</button>
        </div>

        {showForm && (
          <VehiculoForm
            vehiculo={this.state.vehiculoEditando}
            onVehiculoCreado={this.handleVehiculoCreado}
            onCancel={this.handleHideForm}
          />
        )}

        {(vehiculos.length > 0 || !showForm) && !loading && !error && (
          <table>
            <thead>
              <tr>
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Tipo</th>
                <th>Pasajeros</th>
                <th>Estado</th>
                <th>Foto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map(v => (
                <tr key={v.id}>
                  <td>{v.patente}</td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.tipo_vehiculo}</td>
                  <td>{v.capacidad_pasajeros}</td>
                  <td>{v.estado}</td>
                  <td>
                    {v.foto_url ? (
                      <img
                        src={v.foto_url}
                        alt={`Foto de ${v.patente}`}
                        className={style.vehiculoFoto}
                        onClick={() => this.handleImageClick(v.foto_url)}
                        style="cursor: pointer;"
                      />
                    ) : (
                      'Sin foto'
                    )}
                  </td>
                  <td>
                    <button onClick={() => this.handleEditVehiculo(v)} className={style.editButton}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => this.handleDeleteVehiculo(v)} className={style.deleteButton}>
                      🗑️ Eliminar
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selectedImage && (
          <div className={style.modalOverlay} onClick={this.handleCloseImage}>
            <img src={selectedImage} className={style.modalImage} />
          </div>
        )}

        {vehiculos.length === 0 && !showForm && !loading && !error && (
          <p>No hay vehículos registrados.</p>
        )}
      </div>
    );
  }
}

export default VehiculosPage;