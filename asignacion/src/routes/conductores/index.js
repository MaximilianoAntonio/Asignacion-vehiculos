import { h, Component } from 'preact';
import { getConductores, createConductor, deleteConductor } from '../../services/conductorService';
import style from './style.css';
import ConductorForm from '../../components/conductorForm';

class ConductoresPage extends Component {
  state = {
    conductores: [],
    loading: true,
    error: null,
    showForm: false,
    conductorEditando: null,
  };

  componentDidMount() {
    this.cargarConductores();
  }

  cargarConductores = () => {
    this.setState({ loading: true });
    getConductores()
      .then(response => {
        this.setState({
          conductores: response.data.results || response.data,
          loading: false,
          error: null,
        });
      })
      .catch(error => {
        console.error("Error fetching conductores:", error);
        this.setState({ error: 'Error al cargar los conductores.', loading: false });
      });
  };

  handleShowForm = () => {
    this.setState({ showForm: true, conductorEditando: null });
  };

  handleHideForm = () => {
    this.setState({ showForm: false, conductorEditando: null });
  };

  handleConductorGuardado = () => {
    this.setState({ showForm: false, conductorEditando: null });
    this.cargarConductores();
  };

  handleEditConductor = (conductor) => {
    this.setState({ showForm: true, conductorEditando: conductor });
  };

  handleDeleteConductor = (conductor) => {
    const confirmado = window.confirm(`¿Estás seguro de que deseas eliminar al conductor ${conductor.nombre} ${conductor.apellido}?`);
    if (confirmado) {
      deleteConductor(conductor.id)
        .then(() => this.cargarConductores())
        .catch(error => {
          console.error('Error al eliminar el conductor:', error);
          alert('Ocurrió un error al eliminar el conductor.');
        });
    }
  };

  render(_, { conductores, loading, error, showForm }) {
    if (loading) return <p>Cargando conductores...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
      <div class={`${style.panelLayout} ${showForm ? style.withForm : ''}`}>
        <div class={style.dataTableContainer}>
          <div class={style.encabezado}>
            <h1>Listado de Conductores</h1>
            <button onClick={this.handleShowForm} class={style.addButton}>Agregar Conductor</button>
          </div>
          <div class={style.tableContainer}>
            {conductores.length === 0 ? (
              <p>No hay conductores registrados.</p>
            ) : (
              <table class={style.dataTable}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>N° Licencia</th>
                    <th>Vencimiento</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Activo</th>
                    <th>Disponibilidad</th>
                    <th>Tipos Vehículo</th>
                    <th>Lat</th>
                    <th>Lon</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conductores.map(c => (
                    <tr key={c.id}>
                      <td>{c.nombre}</td>
                      <td>{c.apellido}</td>
                      <td>{c.numero_licencia}</td>
                      <td>{c.fecha_vencimiento_licencia}</td>
                      <td>{c.telefono || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.activo ? 'Sí' : 'No'}</td>
                      <td>{c.estado_disponibilidad}</td>
                      <td>{c.tipos_vehiculo_habilitados}</td>
                      <td>{c.ubicacion_actual_lat || '—'}</td>
                      <td>{c.ubicacion_actual_lon || '—'}</td>
                      <td>
                        <button onClick={() => this.handleEditConductor(c)} class={style.editButton}>✏️ Editar</button>
                        <button onClick={() => this.handleDeleteConductor(c)} class={style.deleteButton}>🗑️ Eliminar</button>
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
            <ConductorForm
              conductor={this.state.conductorEditando}
              onConductorGuardado={this.handleConductorGuardado}
              onCancel={this.handleHideForm}
            />
          </div>
        )}
      </div>
    );
  }
}

export default ConductoresPage;
