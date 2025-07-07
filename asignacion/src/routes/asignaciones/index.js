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
    currentDate: new Date(),
    searchFilters: {
      conductor: '',
      vehiculo: '',
      origen: '',
      destino: ''
    }
  };

  componentDidMount() {
    this.cargarAsignaciones();
    this.cargarVehiculosYConductores();
  }

  cargarAsignaciones = () => {
    this.setState({ loading: true });
    const { currentDate, searchFilters } = this.state;

    const params = {
      search: searchFilters.conductor, // Usamos el filtro genérico `search` para el conductor
      vehiculo__patente__icontains: searchFilters.vehiculo,
      origen_descripcion__icontains: searchFilters.origen,
      destino_descripcion__icontains: searchFilters.destino
    };

    const isAnyFilterActive = Object.values(searchFilters).some(filter => filter);

    if (!isAnyFilterActive) {
      const fecha = currentDate.toISOString().split('T')[0];
      params.fecha_hora_requerida_inicio__date = fecha;
    }

    // Eliminar parámetros vacíos
    Object.keys(params).forEach(key => {
      if (!params[key]) {
        delete params[key];
      }
    });

    getAsignaciones(params)
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

  handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    // Ajustar la fecha a la zona horaria local para evitar problemas de "un día antes"
    const userTimezoneOffset = newDate.getTimezoneOffset() * 60000;
    this.setState({ currentDate: new Date(newDate.getTime() + userTimezoneOffset) }, this.cargarAsignaciones);
  };

  handlePrevDay = () => {
    this.setState(prevState => {
      const newDate = new Date(prevState.currentDate);
      newDate.setDate(newDate.getDate() - 1);
      return { currentDate: newDate };
    }, this.cargarAsignaciones);
  };

  handleNextDay = () => {
    this.setState(prevState => {
      const newDate = new Date(prevState.currentDate);
      newDate.setDate(newDate.getDate() + 1);
      return { currentDate: newDate };
    }, this.cargarAsignaciones);
  };

  handleSearchChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      searchFilters: {
        ...prevState.searchFilters,
        [name]: value
      }
    }));
  };

  handleSearchSubmit = (e) => {
    e.preventDefault();
    this.cargarAsignaciones();
  };

  handleClearSearch = () => {
    this.setState({
      searchFilters: {
        conductor: '',
        vehiculo: '',
        origen: '',
        destino: ''
      }
    }, this.cargarAsignaciones);
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

  acortarDireccion(direccion) {
    if (!direccion) return '—';
    // Devuelve la parte hasta la cuarta coma (incluida), o toda si hay menos de 4 comas
    const partes = direccion.split(',');
    if (partes.length > 4) {
      return partes.slice(0, 4).join(',').trim();
    }
    return direccion.trim();
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
        <div class={style.dateNavigation}>
          <button onClick={this.handlePrevDay}>&lt; Día anterior</button>
          <input 
            type="date" 
            value={this.state.currentDate.toISOString().split('T')[0]} 
            onChange={this.handleDateChange} 
            class={style.datePicker}
          />
          <button onClick={this.handleNextDay}>Día siguiente &gt;</button>
        </div>

        <form onSubmit={this.handleSearchSubmit} class={style.searchForm}>
          <input
            type="text"
            name="conductor"
            placeholder="Buscar por conductor..."
            value={this.state.searchFilters.conductor}
            onInput={this.handleSearchChange}
          />
          <input
            type="text"
            name="vehiculo"
            placeholder="Buscar por patente..."
            value={this.state.searchFilters.vehiculo}
            onInput={this.handleSearchChange}
          />
          <input
            type="text"
            name="origen"
            placeholder="Buscar por origen..."
            value={this.state.searchFilters.origen}
            onInput={this.handleSearchChange}
          />
          <input
            type="text"
            name="destino"
            placeholder="Buscar por destino..."
            value={this.state.searchFilters.destino}
            onInput={this.handleSearchChange}
          />
          <button type="submit">Buscar</button>
          <button type="button" onClick={this.handleClearSearch} class={style.clearButton}>Limpiar</button>
        </form>

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
            <div class={style.responsiveTableWrapper}>
              <table class={style.table}>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Conductor</th>
                    <th>Responsable</th>
                    <th>Tel. Responsable</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Inicio</th>
                    <th>Fin Previsto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="9">Cargando asignaciones...</td></tr>
                  ) : error ? (
                    <tr><td colSpan="9" style={{ color: 'red' }}>{error}</td></tr>
                  ) : asignaciones.length === 0 ? (
                    <tr>
                      <td colSpan="9">No hay asignaciones registradas.</td>
                    </tr>
                  ) : (
                    asignaciones.map(a => (
                      <tr
                        key={a.id}
                        class={style.clickableRow}
                        onClick={() => this.handleViewDetails(a)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td data-label="Vehículo">{a.vehiculo?.patente || '—'}</td>
                        <td data-label="Conductor">{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—'}</td>
                        <td data-label="Responsable">{a.responsable_nombre ? a.responsable_nombre : '—'}</td>
                        <td data-label="Tel. Responsable">{a.responsable_telefono ? a.responsable_telefono : '—'}</td>
                        <td data-label="Origen">{this.acortarDireccion(a.origen_descripcion)}</td>
                        <td data-label="Destino">{this.acortarDireccion(a.destino_descripcion)}</td>
                        <td data-label="Inicio">{this.formatearFecha(a.fecha_hora_requerida_inicio)}</td>
                        <td data-label="Fin Previsto">{this.formatearFecha(a.fecha_hora_fin_prevista)}</td>
                        <td data-label="Estado" class={
                          a.estado === 'pendiente' ? style.estadoPendiente :
                          a.estado === 'en_curso' ? style.estadoEnCurso :
                          a.estado === 'finalizada' ? style.estadoFinalizada :
                          a.estado === 'cancelada' ? style.estadoCancelada : ''
                        }>
                          {estadosLabels[a.estado] || a.estado}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL flotante para el formulario */}
        {showForm && (
          <div class={style.modalOverlay} onClick={this.handleHideForm}>
            <div class={style.modalContent} onClick={e => e.stopPropagation()}>
              <AsignacionForm
                asignacion={this.state.asignacionEditando}
                onAsignacionCreada={this.handleAsignacionCreada}
                onCancel={this.handleHideForm}
                vehiculosDisponibles={vehiculos}
                conductoresDisponibles={conductores}
                userGroup={this.props.userGroup}
              />
            </div>
          </div>
        )}

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
                  <p><strong>Responsable:</strong> {detailModalAsignacion.responsable_nombre ? `${detailModalAsignacion.responsable_nombre} (${detailModalAsignacion.responsable_telefono || '—'})` : '—'}</p>
                  <p><strong>Solicitante:</strong> {detailModalAsignacion.solicitante_nombre ? `${detailModalAsignacion.solicitante_nombre} (${detailModalAsignacion.solicitante_telefono || '—'})` : '—'}</p>
                  <p><strong>Origen:</strong> {this.acortarDireccion(detailModalAsignacion.origen_descripcion)}</p>
                  <p><strong>Destino:</strong> {this.acortarDireccion(detailModalAsignacion.destino_descripcion)}</p>
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

