import { h, Component } from 'preact';
import { motion } from 'framer-motion';
import style from './style.css';
import ConductorForm from '../../components/conductorForm';
import { getConductores, createConductor, updateConductor, deleteConductor, iniciarTurno, finalizarTurno } from '../../services/conductorService';
import { getTurnos, updateTurno, deleteTurno } from '../../services/turnoService';
import { exportTurnosPDF } from '../../services/pdfExportService';

const DISPONIBILIDAD_LABELS = {
  disponible: 'Disponible',
  en_ruta: 'En Ruta',
  dia_libre: 'Día Libre',
  no_disponible: 'No Disponible'
};

class ConductoresPage extends Component {
  state = {
    conductores: [],
    loading: true,
    error: null,
    formMode: null, // 'add' | 'edit'
    selectedConductor: null,
    detailModalConductor: null,
    turnos: [],
    processedTurnos: [],
    turnosLoading: false,
    weekOffset: 0,
    editingTurnoPair: null,
    loadingMonthlyReport: false,
  };

  componentDidMount() {
    this.cargarConductores();
  }

  cargarConductores = () => {
    this.setState({ loading: true });
    getConductores()
      .then(conductores => this.setState({ conductores, loading: false, error: null }))
      .catch(() => this.setState({ error: 'Error al cargar los conductores.', loading: false }));
  };

  resetFormState = () => {
    this.setState({ formMode: null, selectedConductor: null });
  };

  handleAddNew = () => {
    this.setState({ formMode: 'add', selectedConductor: null });
  };

  handleEdit = (conductor) => {
    this.setState({ formMode: 'edit', selectedConductor: conductor, detailModalConductor: null });
  };

  handleViewDetails = (conductor) => {
    this.setState({ 
      detailModalConductor: conductor, 
      turnos: [], 
      processedTurnos: [],
      weekOffset: 0 
    }, () => {
      this.fetchTurnosForWeek();
    });
  };

  handleHideDetails = () => {
    this.setState({ detailModalConductor: null, turnos: [], processedTurnos: [] });
  };

  handleSave = async (formData) => {
    try {
      await createConductor(formData);
      this.cargarConductores();
      this.resetFormState();
    } catch (error) {
      alert('Error al guardar el conductor.');
    }
  };

  handleUpdate = async (id, formData) => {
    try {
      await updateConductor(id, formData);
      this.cargarConductores();
      this.resetFormState();
    } catch (error) {
      alert('Error al actualizar el conductor.');
    }
  };

  handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este conductor?')) {
      try {
        await deleteConductor(id);
        this.cargarConductores();
        this.handleHideDetails();
      } catch (error) {
        alert('Error al eliminar el conductor.');
      }
    }
  };

  // Métodos de horarios
  handleIniciarTurno = async (conductorId) => {
    if (window.confirm('¿Está seguro que desea iniciar el turno para este conductor?')) {
      try {
        await iniciarTurno(conductorId);
        this.cargarConductores();
        if (this.state.detailModalConductor?.id === conductorId) {
          this.fetchTurnosForWeek();
        }
      } catch (error) {
        console.error("Error al iniciar turno:", error.response?.data || error.message);
        alert(`Error al iniciar turno: ${error.response?.data?.error || 'Error desconocido'}`);
      }
    }
  };

  handleFinalizarTurno = async (conductorId) => {
    if (window.confirm('¿Está seguro que desea finalizar el turno para este conductor?')) {
      try {
        await finalizarTurno(conductorId);
        this.cargarConductores();
        if (this.state.detailModalConductor?.id === conductorId) {
          this.fetchTurnosForWeek();
        }
      } catch (error) {
        console.error("Error al finalizar turno:", error.response?.data || error.message);
        alert(`Error al finalizar turno: ${error.response?.data?.error || 'Error desconocido'}`);
      }
    }
  };

  _getWeekDateRange = (weekOffset) => {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    
    const dayOfWeek = refDate.getDay();
    const diff = refDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const startOfWeek = new Date(refDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 6));
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  fetchTurnosForWeek = async () => {
    const { detailModalConductor, weekOffset } = this.state;
    if (!detailModalConductor) return;

    this.setState({ turnosLoading: true });

    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);

    const params = {
      conductor: detailModalConductor.id,
      fecha_hora__gte: startOfWeek.toISOString(),
      fecha_hora__lte: endOfWeek.toISOString(),
    };

    try {
      const turnosData = await this.fetchAllTurnos(params);
      this.setState({ 
        turnos: turnosData, 
        processedTurnos: this.processTurnos(turnosData), 
        turnosLoading: false
      });
    } catch (error) {
      console.error("Error fetching turnos:", error);
      this.setState({ turnosLoading: false });
    }
  };

  fetchAllTurnos = async (baseParams) => {
    let allTurnos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params = { ...baseParams, page };
      try {
        const response = await getTurnos(params);
        const turnosData = Array.isArray(response) ? response : (response && Array.isArray(response.results)) ? response.results : [];
        
        if (turnosData.length > 0) {
          allTurnos = allTurnos.concat(turnosData);
        }
        
        const hasNextPage = response && !Array.isArray(response) && response.next;
        if (hasNextPage) {
          page++;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching page ${page} of turnos:`, error);
        throw error;
      }
    }
    return allTurnos;
  }

  processTurnos = (turnos) => {
    const sorted = turnos.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    const pairs = [];
    let openEntrada = null;

    for (const turno of sorted) {
      if (turno.tipo === 'entrada') {
        if (openEntrada) pairs.push({ start: openEntrada, end: null });
        openEntrada = turno;
      } else if (turno.tipo === 'salida') {
        if (openEntrada) {
          pairs.push({ start: openEntrada, end: turno });
          openEntrada = null;
        } else {
          pairs.push({ start: null, end: turno });
        }
      }
    }
    if (openEntrada) pairs.push({ start: openEntrada, end: null });
    
    return pairs.map(p => ({
      ...p,
      duration: p.start && p.end ? this.calculateDuration(p.start.fecha_hora, p.end.fecha_hora) : null
    })).reverse();
  };

  calculateDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    if (diff < 0) return 'Error';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  changeWeek = (direction) => {
    this.setState(prevState => ({ weekOffset: prevState.weekOffset + direction }), () => {
      this.fetchTurnosForWeek();
    });
  };

  handleEditPair = (pair) => {
    this.setState({ editingTurnoPair: pair });
  };

  handleDeletePair = async (pair) => {
    const confirmMsg = pair.start && pair.end
      ? '¿Está seguro de que desea eliminar este turno completo (entrada y salida)?'
      : '¿Está seguro de que desea eliminar este registro de turno?';
    
    if (window.confirm(`${confirmMsg} Esta acción no se puede deshacer.`)) {
      try {
        if (pair.start) await deleteTurno(pair.start.id);
        if (pair.end) await deleteTurno(pair.end.id);
        this.fetchTurnosForWeek();
      } catch (error) {
        alert('Error al eliminar el registro.');
      }
    }
  };

  handleSavePair = async ({ start, end }) => {
    try {
      const updatePromises = [];
      if (start) {
        updatePromises.push(updateTurno(start.id, start.data));
      }
      if (end) {
        updatePromises.push(updateTurno(end.id, end.data));
      }
      
      await Promise.all(updatePromises);

      this.setState({ editingTurnoPair: null });
      this.fetchTurnosForWeek();
    } catch (error) {
      alert('Error al guardar los cambios.');
    }
  };

  handleExportMonthly = async () => {
    const { detailModalConductor, weekOffset } = this.state;
    if (!detailModalConductor) return;

    this.setState({ loadingMonthlyReport: true });

    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    
    const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    try {
      const allTurnos = await this.fetchAllTurnos({ 
        conductor: detailModalConductor.id,
        fecha_hora__gte: startOfMonth.toISOString(),
        fecha_hora__lte: endOfMonth.toISOString(),
      });
      const processed = this.processTurnos(allTurnos);
      
      const turnosForPDF = [...processed].reverse();

      if (turnosForPDF.length === 0) {
        alert('No hay turnos para exportar en el mes seleccionado.');
        this.setState({ loadingMonthlyReport: false });
        return;
      }

      const reportRange = {
        start: startOfMonth.toLocaleDateString('es-ES'),
        end: endOfMonth.toLocaleDateString('es-ES')
      };

      exportTurnosPDF(detailModalConductor, turnosForPDF, reportRange);

    } catch (error) {
      console.error("Error generating monthly report:", error);
      alert("Error al generar el reporte mensual.");
    } finally {
      this.setState({ loadingMonthlyReport: false });
    }
  }

  handleExportWeekly = () => {
    const { detailModalConductor, processedTurnos, weekOffset } = this.state;
    if (!detailModalConductor || processedTurnos.length === 0) {
      alert('No hay turnos para exportar en la semana seleccionada.');
      return;
    }

    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);
    const weekRange = {
      start: startOfWeek.toLocaleDateString('es-ES'),
      end: endOfWeek.toLocaleDateString('es-ES')
    };

    const turnosForPDF = [...processedTurnos].reverse();
    exportTurnosPDF(detailModalConductor, turnosForPDF, weekRange);
  }

  formatTimeOnly = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  handleTurnoActionClick = (e, conductor) => {
    e.stopPropagation();
    if (conductor.estado_disponibilidad === 'dia_libre' || conductor.estado_disponibilidad === 'no_disponible') {
      this.handleIniciarTurno(conductor.id);
    } else {
      this.handleFinalizarTurno(conductor.id);
    }
  };

  renderEditModal = () => {
    const { editingTurnoPair } = this.state;
    if (!editingTurnoPair) return null;

    const formatForInput = (iso) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    
    const startValue = editingTurnoPair.start ? formatForInput(editingTurnoPair.start.fecha_hora) : '';
    const endValue = editingTurnoPair.end ? formatForInput(editingTurnoPair.end.fecha_hora) : '';

    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const start = formData.get('start_time');
      const end = formData.get('end_time');

      if (start && end && new Date(start) >= new Date(end)) {
        alert('La hora de inicio debe ser anterior a la hora de fin.');
        return;
      }

      const saveData = {
        start: editingTurnoPair.start && start ? { id: editingTurnoPair.start.id, data: { fecha_hora: new Date(start).toISOString() } } : null,
        end: editingTurnoPair.end && end ? { id: editingTurnoPair.end.id, data: { fecha_hora: new Date(end).toISOString() } } : null,
      };

      await this.handleSavePair(saveData);
    };

    return (
      <div>
        <div class="card-header">
          <h3 class="card-title">Editar Turno</h3>
        </div>
        <form onSubmit={handleSubmit} style="padding: 1.5rem;">
          <div class="form-group">
            {editingTurnoPair.start && (
              <div class="input-group" style="margin-bottom: 1rem;">
                <label for="start_time" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Inicio</label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  class="form-control"
                  defaultValue={startValue}
                  style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-md);"
                />
              </div>
            )}
            {editingTurnoPair.end && (
              <div class="input-group" style="margin-bottom: 1rem;">
                <label for="end_time" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Fin</label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  class="form-control"
                  defaultValue={endValue}
                  style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-md);"
                />
              </div>
            )}
          </div>
          <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <button 
              type="button" 
              class="btn btn-secondary" 
              onClick={() => this.setState({ editingTurnoPair: null })}
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    );
  };

  renderDetailModal() {
    const { detailModalConductor, turnosLoading, processedTurnos, weekOffset, loadingMonthlyReport } = this.state;

    if (!detailModalConductor) return null;

    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);
    const weekRange = {
      start: startOfWeek.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      end: endOfWeek.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    };

    return (
      <div class={style.modalOverlay} onClick={this.handleHideDetails}>
        <div class={`${style.modalContent} card fade-in`} onClick={e => e.stopPropagation()}>
          <button class={style.modalCloseButton} onClick={this.handleHideDetails}>×</button>
          <div class="card-header">
            <h2 class="card-title">Información del Conductor</h2>
          </div>
          
          <div class={style.modalBody}>
            <div class={style.modalImageContainer}>
              <img
                src={detailModalConductor.foto_url ? `${detailModalConductor.foto_url}` : 'https://th.bing.com/th/id/OIP.5_RqTlUhvMdpCjGOhOmTdQHaHa?rs=1&pid=ImgDetMain'}
                alt="Conductor"
              />
            </div>
            <div class={style.modalDetails}>
              <p><strong>RUN:</strong> {detailModalConductor.run || '—'}</p>
              <p><strong>Nombre:</strong> {detailModalConductor.nombre} {detailModalConductor.apellido}</p>
              <p><strong>N° Licencia:</strong> {detailModalConductor.numero_licencia}</p>
              <p><strong>Vencimiento:</strong> {detailModalConductor.fecha_vencimiento_licencia}</p>
              <p><strong>Teléfono:</strong> {detailModalConductor.telefono || '—'}</p>
              <p><strong>Email:</strong> {detailModalConductor.email || '—'}</p>
              <p><strong>Disponibilidad:</strong> 
                <span class={`status-badge ${detailModalConductor.estado_disponibilidad}`}>
                  {DISPONIBILIDAD_LABELS[detailModalConductor.estado_disponibilidad] || detailModalConductor.estado_disponibilidad}
                </span>
              </p>
              <p><strong>Tipos Vehículo:</strong> {detailModalConductor.tipos_vehiculo_habilitados}</p>
            </div>
          </div>

          <div class={style.turnosSection}>
            <div class={style.turnosHeader}>
              <h4 class={style.turnosTitle}>Turnos de la Semana ({weekRange.start} - {weekRange.end})</h4>
              <div class={style.weekNavigator}>
                <button class="btn btn-outline" onClick={() => this.changeWeek(-1)}>‹ Ant</button>
                <button class="btn btn-outline" onClick={() => this.changeWeek(1)}>Sig ›</button>
              </div>
            </div>
            
            <div class={style.turnosActions}>
              <button class="btn btn-secondary" onClick={this.handleExportWeekly} title="Exportar a PDF Semanal">
                Reporte Semanal
              </button>
              <button 
                class="btn btn-success" 
                onClick={this.handleExportMonthly} 
                disabled={loadingMonthlyReport} 
                title="Exportar Reporte Mensual"
              >
                {loadingMonthlyReport ? 'Generando...' : 'Reporte Mensual'}
              </button>
            </div>

            {turnosLoading && <p>Cargando turnos...</p>}
            {!turnosLoading && processedTurnos.length > 0 && (
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Duración</th>
                      <th class="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedTurnos.map(p => (
                      <tr key={p.start?.id || p.end.id}>
                        <td>{new Date(p.start?.fecha_hora || p.end.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</td>
                        <td>{this.formatTimeOnly(p.start?.fecha_hora)}</td>
                        <td>{this.formatTimeOnly(p.end?.fecha_hora)}</td>
                        <td>{p.duration || 'En curso'}</td>
                        <td class="text-center">
                          <div class={style.turnoActions}>
                            <button title="Editar" class="btn-icon" onClick={() => this.handleEditPair(p)}>✏️</button>
                            <button title="Eliminar" class="btn-icon btn-danger" onClick={() => this.handleDeletePair(p)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!turnosLoading && processedTurnos.length === 0 && (
              <div class={style.noTurnos}>No hay turnos registrados para esta semana.</div>
            )}
          </div>

          <div class={style.modalActions}>
            <button onClick={() => this.handleEdit(detailModalConductor)} class="button button-primary">Editar</button>
            <button onClick={() => this.handleDelete(detailModalConductor.id)} class="button button-danger">Eliminar</button>
            <button
              class={`btn ${detailModalConductor.estado_disponibilidad === 'dia_libre' || detailModalConductor.estado_disponibilidad === 'no_disponible' ? 'btn-success' : 'btn-danger'}`}
              onClick={e => this.handleTurnoActionClick(e, detailModalConductor)}
              disabled={detailModalConductor.estado_disponibilidad === 'en_ruta'}
            >
              {detailModalConductor.estado_disponibilidad === 'en_ruta' ? 'En Ruta' :
               detailModalConductor.estado_disponibilidad === 'dia_libre' || detailModalConductor.estado_disponibilidad === 'no_disponible' ? 'Iniciar Turno' : 'Finalizar Turno'}
            </button>
          </div>

          {/* Modal de edición de turnos */}
          {this.state.editingTurnoPair && (
            <div class="modal-overlay" style="z-index: 1001; position: absolute; top: 0; left: 0; right: 0; bottom: 0;" onClick={() => this.setState({ editingTurnoPair: null })}>
              <motion.div 
                class="modal-content card" 
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style="width: 500px; max-width: 90vw; margin: auto; position: relative; top: 50%; transform: translateY(-50%);"
              >
                {this.renderEditModal()}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }

  renderTable() {
    const { conductores, loading, error } = this.state;

    if (loading) return <p>Cargando conductores...</p>;
    if (error) return <p class="error-message">{error}</p>;

    return (
      <div class="table-container">
        <div class={style.tableTip}>
          <i class="fas fa-info-circle"></i>
          <span>Haz clic en cualquier fila para ver los detalles y horarios del conductor</span>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>RUN</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Disponibilidad</th>
              <th class="text-center">Control Turnos</th>
            </tr>
          </thead>
          <tbody>
            {conductores.length === 0 ? (
              <tr><td colSpan="5">No hay conductores registrados.</td></tr>
            ) : conductores.map(c => (
              <tr 
                key={c.id} 
                class={`slide-in-up ${style.clickableRow}`}
                onClick={() => this.handleViewDetails(c)}
                title="Haz clic para ver detalles y horarios"
              >
                <td data-label="RUN">{c.run || '—'}</td>
                <td data-label="Nombre">{c.nombre}</td>
                <td data-label="Apellido">{c.apellido}</td>
                <td data-label="Disponibilidad">
                  <span class={`${style.statusBadge} ${style[c.estado_disponibilidad]}`}>
                    {DISPONIBILIDAD_LABELS[c.estado_disponibilidad] || c.estado_disponibilidad}
                  </span>
                </td>
                <td data-label="Control Turnos" class="text-center">
                  {c.estado_disponibilidad === 'en_ruta' ? (
                    <button class="btn btn-sm btn-disabled" disabled>En Ruta</button>
                  ) : (
                    <button
                      class={`btn btn-sm ${c.estado_disponibilidad === 'dia_libre' || c.estado_disponibilidad === 'no_disponible' ? 'btn-success' : 'btn-danger'}`}
                      onClick={e => this.handleTurnoActionClick(e, c)}
                    >
                      {c.estado_disponibilidad === 'dia_libre' || c.estado_disponibilidad === 'no_disponible' ? 'Iniciar' : 'Finalizar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    const { formMode, selectedConductor, conductores } = this.state;

    // Contar conductores por disponibilidad
    const conductoresPorDisponibilidad = conductores.reduce((acc, c) => {
      acc[c.estado_disponibilidad] = (acc[c.estado_disponibilidad] || 0) + 1;
      return acc;
    }, {});

    return (
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">Gestión de Conductores y Horarios</h1>
          <button onClick={this.handleAddNew} class="button button-primary">
            <i class="fas fa-plus" style={{marginRight: '0.5rem'}} /> Nuevo Conductor
          </button>
        </div>
        
        <div class={style.statsContainer}>
          <div class={style.statCard}>
            <h3>Disponibles</h3>
            <p>{conductoresPorDisponibilidad['disponible'] || 0}</p>
          </div>
          <div class={style.statCard}>
            <h3>En Ruta</h3>
            <p>{conductoresPorDisponibilidad['en_ruta'] || 0}</p>
          </div>
          <div class={style.statCard}>
            <h3>Día Libre</h3>
            <p>{conductoresPorDisponibilidad['dia_libre'] || 0}</p>
          </div>
          <div class={style.statCard}>
            <h3>No Disponibles</h3>
            <p>{conductoresPorDisponibilidad['no_disponible'] || 0}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Lista de Conductores</h2>
          </div>
          {this.renderTable()}
        </div>
        
        {formMode && (
          <div class={style.modalOverlay} onClick={this.resetFormState}>
            <div class={`${style.modalContent} card fade-in`} onClick={e => e.stopPropagation()}>
              <ConductorForm
                conductor={selectedConductor}
                onSave={this.handleSave}
                onUpdate={this.handleUpdate}
                onCancel={this.resetFormState}
              />
            </div>
          </div>
        )}

        {this.renderDetailModal()}
      </div>
    );
  }
}

export default ConductoresPage;
