import { h, Component } from 'preact';
import { getAsignaciones, deleteAsignacion, procesarAsignaciones } from '../../services/asignacionService';
import style from './style.css';
import { lazy, Suspense } from 'preact/compat';

// Lazy loading para componentes pesados
const AsignacionForm = lazy(() => import('../../components/asignacionForm'));
const MapView = lazy(() => import('../../components/MapView'));

// Lazy loading para el servicio de PDF (solo cuando se necesite)
const exportPDF = async (asignaciones) => {
  const { exportAsignacionesPDF } = await import('../../services/pdfExportService');
  return exportAsignacionesPDF(asignaciones);
};

// Componente de loading ligero
const ComponentLoading = () => (
  <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
    Cargando componente...
  </div>
);

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
      const fecha = this.formatDateForInput(currentDate);
      params.fecha_hora_requerida_inicio__date = fecha;
    }

    // Eliminar parámetros vacíos
    Object.keys(params).forEach(key => {
      if (!params[key]) {
        delete params[key];
      }
    });        getAsignaciones(params)
            .then(asignaciones => {
                this.setState({
                    asignaciones,
                    loading: false,
                    error: null,
                });
            })
            .catch(() => {
                this.setState({ error: 'Error al cargar las asignaciones.', loading: false });
            });
  };    cargarVehiculosYConductores = async () => {
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
        .catch(() => {
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

  // Función helper para formatear fecha al formato YYYY-MM-DD sin problemas de zona horaria
  formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  handleDateChange = (e) => {
    const dateString = e.target.value; // formato YYYY-MM-DD
    console.log('Fecha seleccionada:', dateString);
    // Crear la fecha directamente desde el string para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const newDate = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11 para meses
    console.log('Nueva fecha creada:', newDate, 'Día:', newDate.getDate(), 'Mes:', newDate.getMonth() + 1);
    this.setState({ currentDate: newDate }, this.cargarAsignaciones);
  };

  handlePrevDay = () => {
    this.setState(prevState => {
      const newDate = new Date(prevState.currentDate);
      newDate.setDate(newDate.getDate() - 1);
      console.log('Día anterior:', newDate);
      return { currentDate: newDate };
    }, this.cargarAsignaciones);
  };

  handleNextDay = () => {
    this.setState(prevState => {
      const newDate = new Date(prevState.currentDate);
      newDate.setDate(newDate.getDate() + 1);
      console.log('Día siguiente:', newDate);
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
      .catch(() => {
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
      pendiente_auto: 'Pendientes',
      programada: 'Programadas',
      activa: 'En Curso',
      completada: 'Finalizadas',
      cancelada: 'Canceladas',
      fallo_auto: 'Fallo Auto'
    };

    if (loading) return <p>Cargando asignaciones...</p>;
    if (error) return <p class="error-message">{error}</p>;

    return (
      <div class="table-container">
        {/* Tip informativo */}
        <div class={style.tableTip}>
          <i class="fas fa-info-circle"></i>
          <span>Haz clic en cualquier fila para ver los detalles de la asignación</span>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>Solicitante</th>
              <th>Responsable</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Inicio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.length === 0 ? (
              <tr><td colSpan="8">No hay asignaciones para la fecha o filtros seleccionados.</td></tr>
            ) : (
              asignaciones.map(a => (
                <tr 
                  key={a.id} 
                  class={`slide-in-up ${style.clickableRow}`}
                  onClick={() => this.handleViewDetails(a)}
                  title="Haz clic para ver detalles de la asignación"
                >
                  <td data-label="Vehículo">{a.vehiculo?.patente || '—'}</td>
                  <td data-label="Conductor">{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—'}</td>
                  <td data-label="Solicitante">{a.solicitante_nombre || '—'}</td>
                  <td data-label="Responsable">{a.responsable_nombre || '—'}</td>
                  <td data-label="Origen">{this.acortarDireccion(a.origen_descripcion)}</td>
                  <td data-label="Destino">{this.acortarDireccion(a.destino_descripcion)}</td>
                  <td data-label="Inicio">{this.formatearFecha(a.fecha_hora_requerida_inicio)}</td>
                  <td data-label="Estado">
                    <span class={`${style.statusBadge} ${style[a.estado]}`}>
                      {(() => {
                        const estadosIndividuales = {
                          pendiente_auto: 'Pendiente',
                          programada: 'Programada',
                          activa: 'En Curso',
                          completada: 'Finalizada',
                          cancelada: 'Cancelada',
                          fallo_auto: 'Fallo Auto'
                        };
                        return estadosIndividuales[a.estado] || a.estado;
                      })()}
                    </span>
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
      <div class="modal-overlay" onClick={this.handleHideDetails}>
        <div class="modal-content card" onClick={e => e.stopPropagation()}>
          <div class="card-header">
            <h2 class="card-title">Información de la Asignación</h2>
            <button class="modal-close-btn" onClick={this.handleHideDetails}>×</button>
          </div>
          
          <div class="modal-body">
            <div class="modal-sections">
              <div class="modal-map-section">
                <div class="map-container">
                  <Suspense fallback={<ComponentLoading />}>
                    <MapView asignacion={detailModalAsignacion} />
                  </Suspense>
                </div>
              </div>
              
              <div class="modal-info-section">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Vehículo:</span>
                    <span class="info-value">{detailModalAsignacion.vehiculo?.patente || '—'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Conductor:</span>
                    <span class="info-value">{detailModalAsignacion.conductor ? `${detailModalAsignacion.conductor.nombre} ${detailModalAsignacion.conductor.apellido}` : '—'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Responsable:</span>
                    <span class="info-value">{detailModalAsignacion.responsable_nombre ? `${detailModalAsignacion.responsable_nombre} (${detailModalAsignacion.responsable_telefono || '—'})` : '—'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Solicitante:</span>
                    <span class="info-value">{detailModalAsignacion.solicitante_nombre ? `${detailModalAsignacion.solicitante_nombre} (${detailModalAsignacion.solicitante_telefono || '—'})` : '—'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Origen:</span>
                    <span class="info-value">{this.acortarDireccion(detailModalAsignacion.origen_descripcion)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Destino:</span>
                    <span class="info-value">{this.acortarDireccion(detailModalAsignacion.destino_descripcion)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Inicio:</span>
                    <span class="info-value">{this.formatearFecha(detailModalAsignacion.fecha_hora_requerida_inicio)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Fin Previsto:</span>
                    <span class="info-value">{this.formatearFecha(detailModalAsignacion.fecha_hora_fin_prevista)}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class={`status-badge ${detailModalAsignacion.estado}`}>
                      {(() => {
                        const estadosIndividuales = {
                          pendiente_auto: 'Pendiente',
                          programada: 'Programada',
                          activa: 'En Curso',
                          completada: 'Finalizada',
                          cancelada: 'Cancelada',
                          fallo_auto: 'Fallo Auto'
                        };
                        return estadosIndividuales[detailModalAsignacion.estado] || detailModalAsignacion.estado;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions" style="display: flex; justify-content: space-between;">
            <button onClick={() => { this.handleDeleteAsignacion(detailModalAsignacion); this.handleHideDetails(); }} class="button button-danger">Eliminar</button>
            <button onClick={() => { this.handleEditAsignacion(detailModalAsignacion); this.handleHideDetails(); }} class="button button-primary">Editar</button>
          </div>
        </div>
      </div>
    );
  }

  render(_, { asignaciones, loading, showForm, vehiculos, conductores }) {
    // Contar asignaciones por estado (ya normalizados desde el servicio)
    const asignacionesPorEstado = asignaciones.reduce((acc, a) => {
      const estado = a.estado || 'pendiente';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    return (
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">Gestión de Asignaciones</h1>
          <button class="button button-primary" onClick={this.handleShowForm}>
            <i class="fas fa-plus" style={{marginRight: '0.5rem'}} /> Nueva Asignación
          </button>
        </div>

        <div class={`${style.filtersCard} card`}>
          <div class={style.dateNavigation}>
            <button onClick={this.handlePrevDay} class={`button button-outline ${style.dateArrow}`}>‹</button>
            <div class={style.dateInputContainer}>
              <input 
                type="date" 
                value={this.formatDateForInput(this.state.currentDate)} 
                onChange={this.handleDateChange} 
                class="form-control"
              />
            </div>
            <button onClick={this.handleNextDay} class={`button button-outline ${style.dateArrow}`}>›</button>
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
          <div class={style.statCard}><h3>Finalizadas</h3><p>{asignacionesPorEstado['completada'] || 0}</p></div>
          <div class={style.statCard}><h3>En Curso</h3><p>{asignacionesPorEstado['activa'] || 0}</p></div>
          <div class={style.statCard}><h3>Pendientes</h3><p>{(asignacionesPorEstado['pendiente_auto'] || 0) + (asignacionesPorEstado['programada'] || 0)}</p></div>
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
              <button class="button button-outline" onClick={() => exportPDF(asignaciones)} disabled={loading || asignaciones.length === 0}>
                Exportar PDF
              </button>
            </div>
          </div>
          {this.renderTable()}
        </div>

        {showForm && (
          <div class={style.modalOverlay} onClick={this.handleHideForm}>
            <div class={`${style.modalContent} card fade-in`} onClick={e => e.stopPropagation()}>
              <Suspense fallback={<ComponentLoading />}>
                <AsignacionForm
                  asignacion={this.state.asignacionEditando}
                  onAsignacionCreada={this.handleAsignacionCreada}
                  onCancel={this.handleHideForm}
                  vehiculosDisponibles={vehiculos}
                  conductoresDisponibles={conductores}
                  userGroup={this.props.userGroup}
                />
              </Suspense>
            </div>
          </div>
        )}

        {this.renderDetailModal()}
      </div>
    );
  }
}

export default AsignacionesPage;

