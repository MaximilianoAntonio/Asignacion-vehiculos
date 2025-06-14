import { h, Component } from 'preact';
import { getAsignaciones, deleteAsignacion, procesarAsignaciones } from '../../services/asignacionService';
import { exportAsignacionesPDF } from '../../services/pdfExportService';
import style from './style.css';
import AsignacionForm from '../../components/asignacionForm';
import MapView from '../../components/MapView';

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

  handleProcesarAsignaciones = () => {
    this.setState({ loading: true });
    procesarAsignaciones()
      .then(() => {
        this.cargarAsignaciones();
        alert('Asignaciones procesadas correctamente.');
      })
      .catch(error => {
        alert('Ocurrió un error al procesar las asignaciones.');
        this.setState({ loading: false });
      });
  };

  formatearFecha(fechaStr) {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate();
    const mes = fecha.toLocaleString('es-ES', { month: 'long' });
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dia} / ${mes.charAt(0).toUpperCase() + mes.slice(1)} / ${hora}`;
  }

  render(_, { asignaciones, loading, error, showForm, vehiculos, conductores, detailModalAsignacion }) {
    const estadosLabels = {
      pendiente: 'Pendiente',
      en_curso: 'En Curso',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada'
    };

    const asignacionesPorEstado = asignaciones.reduce((acc, a) => {
      acc[a.estado] = (acc[a.estado] || 0) + 1;
      return acc;
    }, {});

    return (
      <div class={style.asignacionesPage}>
        <h1>Gestión de Asignaciones</h1>
        {/* Mueve los contadores aquí */}
        <div class={style.estadoCounters}>
          <span class={style.estadoFinalizada}>
            Finalizada: {asignacionesPorEstado['finalizada'] || 0}
          </span>
          <span class={style.estadoEnCurso}>
            En Curso: {asignacionesPorEstado['en_curso'] || 0}
          </span>
          <span class={style.estadoPendiente}>
            Pendiente: {asignacionesPorEstado['pendiente'] || 0}
          </span>
          <span class={style.estadoCancelada}>
            Cancelada: {asignacionesPorEstado['cancelada'] || 0}
          </span>
        </div>
        <div class={style.tableActions}>
          <button class={style.addButton} onClick={this.handleShowForm}>
            Agregar asignación
          </button>
          <button class={style.processButton} onClick={this.handleProcesarAsignaciones} disabled={loading}>
            Procesar asignaciones
          </button>
          <button class={style.exportButton} onClick={() => exportAsignacionesPDF(asignaciones)} disabled={loading || asignaciones.length === 0}>
            Exportar PDF
          </button>
        </div>
        <div class={style.pageLayout}>
          <div class={style.leftColumn}>
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
                  <th>Ver Mapa</th> {/* Nueva columna */}
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
                    <tr
                      key={a.id}
                      class={style.clickableRow}
                      onClick={() => this.handleViewDetails(a)} // <-- Agrega esto
                      style={{ cursor: 'pointer' }} // Opcional: cambia el cursor
                    >
                      <td>{a.vehiculo?.patente || '—'}</td>
                      <td>{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—'}</td>
                      <td>{a.destino_descripcion}</td>
                      <td>{a.origen_descripcion || '—'}</td>
                      <td>{this.formatearFecha(a.fecha_hora_requerida_inicio)}</td>
                      <td>{this.formatearFecha(a.fecha_hora_fin_prevista)}</td>
                      <td class={
                        a.estado === 'pendiente' ? style.estadoPendiente :
                        a.estado === 'en_curso' ? style.estadoEnCurso :
                        a.estado === 'finalizada' ? style.estadoFinalizada :
                        a.estado === 'cancelada' ? style.estadoCancelada : ''
                      }>
                        {estadosLabels[a.estado] || a.estado}
                      </td>
                      <td>
                        <button
                          onClick={e => {
                            e.stopPropagation(); // Evita que el click en el botón abra el modal de detalles
                            this.setState({ mapaModalAsignacion: a });
                          }}
                        >
                          Ver Mapa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div class={style.rightColumn}>
            {showForm ? (
                <AsignacionForm
                  asignacion={this.state.asignacionEditando}
                  onAsignacionCreada={this.handleAsignacionCreada}
                  onCancel={this.handleHideForm}
                  vehiculosDisponibles={vehiculos}
                  conductoresDisponibles={conductores}
                  userGroup={this.props.userGroup}
                />
            ) : (
              <div class={style.formPlaceholder}>
                <p>Seleccione "Agregar Asignación" o haga clic en una fila para ver detalles y editar.</p>
              </div>
            )}
          </div>
        </div>

        {detailModalAsignacion && (
          <div class={style.modalOverlay} onClick={this.handleHideDetails}>
            <div
              class={style.modalContent}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '32px',
                minWidth: '900px'
              }}
            >
              {/* Mapa a la izquierda */}
              <div style={{ flex: '1 1 0%', minWidth: '400px', minHeight: '350px' }}>
                <h3>Ruta en el Mapa</h3>
                <MapView asignacion={detailModalAsignacion} />
              </div>
              {/* Detalles a la derecha */}
              <div style={{ flex: '1 1 0%' }}>
                <button class={style.modalCloseButton} onClick={this.handleHideDetails}>×</button>
                <h2>Información de la Asignación</h2>
                <div class={style.modalDetails}>
                  <p><strong>Vehículo:</strong> {detailModalAsignacion.vehiculo?.patente || '—'}</p>
                  <p><strong>Conductor:</strong> {detailModalAsignacion.conductor ? `${detailModalAsignacion.conductor.nombre} ${detailModalAsignacion.conductor.apellido}` : '—'}</p>
                  <p><strong>Destino:</strong> {detailModalAsignacion.destino_descripcion}</p>
                  <p><strong>Origen:</strong> {detailModalAsignacion.origen_descripcion || '—'}</p>
                  <p><strong>Inicio:</strong> {this.formatearFecha(detailModalAsignacion.fecha_hora_requerida_inicio)}</p>
                  <p><strong>Fin Previsto:</strong> {this.formatearFecha(detailModalAsignacion.fecha_hora_fin_prevista)}</p>
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
        {this.state.mapaModalAsignacion && (
          <div class={style.modalOverlay} onClick={() => this.setState({ mapaModalAsignacion: null })}>
            <div class={style.modalContent} onClick={e => e.stopPropagation()} style={{ width: '600px', height: '450px' }}>
              <button class={style.modalCloseButton} onClick={() => this.setState({ mapaModalAsignacion: null })}>×</button>
              <h2>Ruta en el Mapa</h2>
              <MapView asignacion={this.state.mapaModalAsignacion} />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AsignacionesPage;

