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

  renderTable() {
    const { asignaciones, loading, error } = this.state;
    const estadosLabels = {
      pendiente: 'Pendiente',
      en_curso: 'En Curso',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada'
    };

    if (loading) return <p>Cargando asignaciones...</p>;
    if (error) return <p class="error-message">{error}</p>;

    return (
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Inicio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.length === 0 ? (
              <tr><td colSpan="7">No hay asignaciones para la fecha o filtros seleccionados.</td></tr>
            ) : (
              asignaciones.map(a => (
                <tr key={a.id} class="slide-in-up">
                  <td data-label="Vehículo">{a.vehiculo?.patente || '—'}</td>
                  <td data-label="Conductor">{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—'}</td>
                  <td data-label="Origen">{this.acortarDireccion(a.origen_descripcion)}</td>
                  <td data-label="Destino">{this.acortarDireccion(a.destino_descripcion)}</td>
                  <td data-label="Inicio">{this.formatearFecha(a.fecha_hora_requerida_inicio)}</td>
                  <td data-label="Estado">
                    <span class={`${style.statusBadge} ${style[a.estado]}`}>
                      {estadosLabels[a.estado] || a.estado}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button onClick={() => this.handleViewDetails(a)} class="button button-outline">Ver Detalles</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  renderDetailModal() {
    const { detailModalAsignacion } = this.state;
    if (!detailModalAsignacion) return null;

    return (
      <div class={style.modalOverlay} onClick={this.handleHideDetails}>
        <div class={`${style.modalContent} card fade-in`} onClick={e => e.stopPropagation()}>
          <button class={style.modalCloseButton} onClick={this.handleHideDetails}>×</button>
          <div class="card-header">
            <h2 class="card-title">Información de la Asignación</h2>
          </div>
          <div class={style.modalBody}>
            <div class={style.mapContainer}>
              <MapView asignacion={detailModalAsignacion} />
            </div>
            <div class={style.modalDetails}>
              <p><strong>Vehículo:</strong> {detailModalAsignacion.vehiculo?.patente || '—'}</p>
              <p><strong>Conductor:</strong> {detailModalAsignacion.conductor ? `${detailModalAsignacion.conductor.nombre} ${detailModalAsignacion.conductor.apellido}` : '—'}</p>
              <p><strong>Responsable:</strong> {detailModalAsignacion.responsable_nombre ? `${detailModalAsignacion.responsable_nombre} (${detailModalAsignacion.responsable_telefono || '—'})` : '—'}</p>
              <p><strong>Solicitante:</strong> {detailModalAsignacion.solicitante_nombre ? `${detailModalAsignacion.solicitante_nombre} (${detailModalAsignacion.solicitante_telefono || '—'})` : '—'}</p>
              <p><strong>Origen:</strong> {this.acortarDireccion(detailModalAsignacion.origen_descripcion)}</p>
              <p><strong>Destino:</strong> {this.acortarDireccion(detailModalAsignacion.destino_descripcion)}</p>
              <p><strong>Inicio:</strong> {this.formatearFecha(detailModalAsignacion.fecha_hora_requerida_inicio)}</p>
              <p><strong>Fin Previsto:</strong> {this.formatearFecha(detailModalAsignacion.fecha_hora_fin_prevista)}</p>
              <p><strong>Estado:</strong> <span class={`${style.statusBadge} ${style[detailModalAsignacion.estado]}`}>{detailModalAsignacion.estado}</span></p>
            </div>
          </div>
          <div class={style.modalActions}>
            <button onClick={() => { this.handleEditAsignacion(detailModalAsignacion); this.handleHideDetails(); }} class="button button-primary">Editar</button>
            <button onClick={() => { this.handleDeleteAsignacion(detailModalAsignacion); this.handleHideDetails(); }} class="button button-danger">Eliminar</button>
          </div>
        </div>
      </div>
    );
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
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">Gestión de Asignaciones</h1>
          <button class="button button-primary" onClick={this.handleShowForm}>
            <i class="fas fa-plus" style={{marginRight: '0.5rem'}}></i> Nueva Asignación
          </button>
        </div>

        <div class={`${style.filtersCard} card`}>
          <div class={style.dateNavigation}>
            <button onClick={this.handlePrevDay} class="button button-outline">&lt;</button>
            <input 
              type="date" 
              value={this.state.currentDate.toISOString().split('T')[0]} 
              onChange={this.handleDateChange} 
              class="form-control"
            />
            <button onClick={this.handleNextDay} class="button button-outline">&gt;</button>
          </div>
          <form onSubmit={this.handleSearchSubmit} class={style.filtersGrid}>
            <input
              type="text"
              name="conductor"
              placeholder="Buscar por conductor..."
              value={this.state.searchFilters.conductor}
              onInput={this.handleSearchChange}
              class="form-control"
            />
            <input
              type="text"
              name="vehiculo"
              placeholder="Buscar por patente..."
              value={this.state.searchFilters.vehiculo}
              onInput={this.handleSearchChange}
              class="form-control"
            />
            <input
              type="text"
              name="origen"
              placeholder="Buscar por origen..."
              value={this.state.searchFilters.origen}
              onInput={this.handleSearchChange}
              class="form-control"
            />
            <input
              type="text"
              name="destino"
              placeholder="Buscar por destino..."
              value={this.state.searchFilters.destino}
              onInput={this.handleSearchChange}
              class="form-control"
            />
            <div class={style.filterActions}>
              <button type="submit" class="button button-primary">Buscar</button>
              <button type="button" onClick={this.handleClearSearch} class="button button-outline">Limpiar</button>
            </div>
          </form>
        </div>
        
        <div class={style.statsContainer}>
          <div class={style.statCard}><h3>Finalizadas</h3><p>{asignacionesPorEstado['finalizada'] || 0}</p></div>
          <div class={style.statCard}><h3>En Curso</h3><p>{asignacionesPorEstado['en_curso'] || 0}</p></div>
          <div class={style.statCard}><h3>Pendientes</h3><p>{asignacionesPorEstado['pendiente'] || 0}</p></div>
          <div class={style.statCard}><h3>Canceladas</h3><p>{asignacionesPorEstado['cancelada'] || 0}</p></div>
        </div>

        <div class="card">
          <div class={`${style.cardHeaderActions} card-header`}>
            <h2 class="card-title">
              Asignaciones para {this.state.currentDate.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
            </h2>
            <div class={style.tableActions}>
              <button class="button button-secondary" onClick={this.handleProcesarAsignaciones} disabled={loading}>
                Procesar
              </button>
              <button class="button button-outline" onClick={() => exportAsignacionesPDF(asignaciones)} disabled={loading || asignaciones.length === 0}>
                Exportar PDF
              </button>
            </div>
          </div>
          {this.renderTable()}
        </div>

        {showForm && (
          <div class={style.modalOverlay} onClick={this.handleHideForm}>
            <div class={`${style.modalContent} card fade-in`} onClick={e => e.stopPropagation()}>
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

        {this.renderDetailModal()}
      </div>
    );
  }
}

export default AsignacionesPage;

