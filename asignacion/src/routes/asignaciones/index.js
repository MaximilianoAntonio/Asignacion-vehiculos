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
    detailModalAsignacion: null, // Para el modal de detalles
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
          asignaciones,
          loading: false,
          error: null,
        });
      })
      .catch(error => {
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
          alert('Ocurrió un error al eliminar la asignación.');
        });
    }
  };

  handleViewDetails = (asignacion) => {
    this.setState({ detailModalAsignacion: asignacion });
  };

  handleHideDetails = () => {
    this.setState({ detailModalAsignacion: null });
  };

  render(_, { asignaciones, loading, error, showForm, vehiculos, conductores, detailModalAsignacion }) {
    return (
      <div class={style.asignacionesPage}>
        <h1>Gestión de Asignaciones</h1>
        <div class={style.pageLayout}>
          <div class={style.leftColumn}>
            <button class={style.addButton} onClick={this.handleShowForm}>
              Agregar Asignación
            </button>
            <table class={style.table}>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Conductor</th>
                  <th>Destino</th>
                  <th>Origen</th>
                  <th>Inicio</th>
                  <th>Fin Previsto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8">Cargando asignaciones...</td></tr>
                ) : error ? (
                  <tr><td colSpan="8" style={{ color: 'red' }}>{error}</td></tr>
                ) : asignaciones.length === 0 ? (
                  <tr>
                    <td colSpan="8">No hay asignaciones registradas.</td>
                  </tr>
                ) : (
                  asignaciones.map(a => (
                    <tr key={a.id} onClick={() => this.handleViewDetails(a)} class={style.clickableRow}>
                      <td>{a.vehiculo?.patente || '—'}</td>
                      <td>{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—'}</td>
                      <td>{a.destino_descripcion}</td>
                      <td>{a.origen_descripcion || '—'}</td>
                      <td>{a.fecha_hora_requerida_inicio}</td>
                      <td>{a.fecha_hora_fin_prevista || '—'}</td>
                      <td>{a.estado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div class={style.rightColumn}>
            {showForm ? (
              <div class={style.formContainer}>
                <h2>{this.state.asignacionEditando ? 'Editar Asignación' : 'Agregar Asignación'}</h2>
                <AsignacionForm
                  asignacion={this.state.asignacionEditando}
                  onAsignacionCreada={this.handleAsignacionCreada}
                  onCancel={this.handleHideForm}
                  vehiculosDisponibles={vehiculos}
                  conductoresDisponibles={conductores}
                  userGroup={this.props.userGroup}
                />
              </div>
            ) : (
              <div class={style.formPlaceholder}>
                <p>Seleccione "Agregar Asignación" o haga clic en una fila para ver detalles y editar.</p>
              </div>
            )}
          </div>
        </div>

        {detailModalAsignacion && (
          <div class={style.modalOverlay} onClick={this.handleHideDetails}>
            <div class={style.modalContent} onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '32px' }}>
              <div style={{ flex: '1 1 0%' }}>
                <button class={style.modalCloseButton} onClick={this.handleHideDetails}>×</button>
                <h2>Información de la Asignación</h2>
                <div class={style.modalDetails}>
                  <p><strong>Vehículo:</strong> {detailModalAsignacion.vehiculo?.patente || '—'}</p>
                  <p><strong>Conductor:</strong> {detailModalAsignacion.conductor ? `${detailModalAsignacion.conductor.nombre} ${detailModalAsignacion.conductor.apellido}` : '—'}</p>
                  <p><strong>Destino:</strong> {detailModalAsignacion.destino_descripcion}</p>
                  <p><strong>Origen:</strong> {detailModalAsignacion.origen_descripcion || '—'}</p>
                  <p><strong>Inicio:</strong> {detailModalAsignacion.fecha_hora_requerida_inicio}</p>
                  <p><strong>Fin Previsto:</strong> {detailModalAsignacion.fecha_hora_fin_prevista || '—'}</p>
                  <p><strong>Estado:</strong> {detailModalAsignacion.estado}</p>
                </div>
                <div class={style.modalActions}>
                  <button onClick={() => { this.handleEditAsignacion(detailModalAsignacion); this.handleHideDetails(); }} class={style.editButton}>Editar</button>
                  <button onClick={() => { this.handleDeleteAsignacion(detailModalAsignacion); this.handleHideDetails(); }} class={style.deleteButton}>Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AsignacionesPage;

