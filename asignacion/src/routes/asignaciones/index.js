import { h, Component } from 'preact';
import { getAsignaciones, deleteAsignacion } from '../../services/asignacionService';
import style from './style.css';
import AsignacionForm from '../../components/asignacionForm';

class AsignacionesPage extends Component {
  state = {
    asignaciones: [],
    loading: true,
    error: null,
    showForm: false,
    asignacionEditando: null,
    vehiculos: [],
    conductores: [],
  };

  componentDidMount() {
    this.cargarAsignaciones();
    this.cargarVehiculosYConductores();
  }

  cargarAsignaciones = () => {
    this.setState({ loading: true });
    getAsignaciones()
      .then(asignaciones => {
        this.setState({
          asignaciones, // ya es un array
          loading: false,
          error: null,
        });
      })
      .catch(error => {
        console.error("Error al cargar asignaciones:", error);
        this.setState({ error: 'Error al cargar las asignaciones.', loading: false });
      });
  };

  cargarVehiculosYConductores = async () => {
    const [vehiculos, conductores] = await Promise.all([
      import('../../services/vehicleService').then(m => m.getVehiculos()),
      import('../../services/conductorService').then(m => m.getConductores())
    ]);
    this.setState({
      vehiculos,
      conductores
    });
  }

  handleShowForm = () => {
    this.setState({ showForm: true, asignacionEditando: null });
  };

  handleHideForm = () => {
    this.setState({ showForm: false, asignacionEditando: null });
  };

  handleAsignacionCreada = () => {
    this.setState({ showForm: false, asignacionEditando: null });
    this.cargarAsignaciones();
  };

  handleEditAsignacion = (asignacion) => {
    this.setState({ showForm: true, asignacionEditando: asignacion });
  };

  handleDeleteAsignacion = (asignacion) => {
    const confirmado = window.confirm(`¿Deseas eliminar esta asignación al destino: ${asignacion.destino_descripcion}?`);
    if (confirmado) {
      deleteAsignacion(asignacion.id)
        .then(() => this.cargarAsignaciones())
        .catch(error => {
          console.error('Error al eliminar la asignación:', error);
          alert('Ocurrió un error al eliminar la asignación.');
        });
    }
  };

  render(_, { asignaciones, loading, error, showForm, vehiculos, conductores }) {
    if (loading) return <p>Cargando asignaciones...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
      <div class={`${style.panelLayout} ${showForm ? style.withForm : ''}`}>
        <div class={style.dataTableContainer}>
          <div class={style.encabezado}>
            <h1 class={style.titulo}>Listado de Asignaciones</h1>
            <div style="text-align: center;">
              <button class={style.addButton} onClick={this.handleShowForm}>Agregar Asignación</button>
            </div>
          </div>
          <div class={style.tableContainer}>
            {asignaciones.length === 0 ? (
              <p>No hay asignaciones registradas.</p>
            ) : (
              <table class={style.dataTable}>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Conductor</th>
                    <th>Destino</th>
                    <th>Origen</th>
                    <th>Inicio</th>
                    <th>Fin Previsto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.map(a => (
                    <tr key={a.id}>
                      <td>{a.vehiculo?.patente || '—'}</td>
                      <td>{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—'}</td>
                      <td>{a.destino_descripcion}</td>
                      <td>{a.origen_descripcion || '—'}</td>
                      <td>{a.fecha_hora_requerida_inicio}</td>
                      <td>{a.fecha_hora_fin_prevista || '—'}</td>
                      <td>{a.estado}</td>
                      <td>
                        <button onClick={() => this.handleEditAsignacion(a)} class={style.editButton}>✏️ Editar</button>
                        <button onClick={() => this.handleDeleteAsignacion(a)} class={style.deleteButton}>🗑️ Eliminar</button>
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
            <AsignacionForm
              asignacion={this.state.asignacionEditando}
              onAsignacionCreada={this.handleAsignacionCreada}
              onCancel={this.handleHideForm}
              vehiculosDisponibles={vehiculos}
              conductoresDisponibles={conductores}
            />
          </div>
        )}
      </div>
    );
  }
}

export default AsignacionesPage;

