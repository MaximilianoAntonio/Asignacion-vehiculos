import { h, Component } from 'preact';
import { motion } from 'framer-motion';
import { getConductores, iniciarTurno, finalizarTurno } from '../../services/conductorService';
import { getTurnos, updateTurno, deleteTurno } from '../../services/turnoService';
import { exportTurnosPDF } from '../../services/pdfExportService';
import style from './style.css';

const DISPONIBILIDAD_LABELS = {
  disponible: 'Disponible',
  en_ruta: 'En Ruta',
  dia_libre: 'Día Libre',
  no_disponible: 'No Disponible'
};

class TurnoPairEditModal extends Component {
    constructor(props) {
        super(props);
        const { turnoPair } = props;
        const formatForInput = (iso) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
        
        this.state = {
            start: turnoPair.start ? formatForInput(turnoPair.start.fecha_hora) : '',
            end: turnoPair.end ? formatForInput(turnoPair.end.fecha_hora) : '',
        };
    }

    handleSave = (e) => {
        e.preventDefault();
        const { start, end } = this.state;
        const { turnoPair } = this.props;

        if (start && end && new Date(start) >= new Date(end)) {
            alert('La hora de inicio debe ser anterior a la hora de fin.');
            return;
        }

        const saveData = {
            start: turnoPair.start && start ? { id: turnoPair.start.id, data: { fecha_hora: new Date(start).toISOString() } } : null,
            end: turnoPair.end && end ? { id: turnoPair.end.id, data: { fecha_hora: new Date(end).toISOString() } } : null,
        };

        this.props.onSave(saveData);
    }

    render() {
        const { onCancel, turnoPair } = this.props;
        const { start, end } = this.state;

        return (
            <div class="modal-overlay" onClick={onCancel}>
                <motion.div 
                    class="modal-content card" 
                    onClick={e => e.stopPropagation()}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <h3 class="modal-title">Editar Turno</h3>
                    <form onSubmit={this.handleSave} class="form-container">
                        <div class="form-group">
                            {turnoPair.start && (
                                <div class="input-group">
                                    <label for="start_time">Inicio</label>
                                    <input
                                        type="datetime-local"
                                        id="start_time"
                                        class="form-control"
                                        value={start}
                                        onInput={e => this.setState({ start: e.target.value })}
                                    />
                                </div>
                            )}
                            {turnoPair.end && (
                                <div class="input-group">
                                    <label for="end_time">Fin</label>
                                    <input
                                        type="datetime-local"
                                        id="end_time"
                                        class="form-control"
                                        value={end}
                                        onInput={e => this.setState({ end: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        );
    }
}

class HorariosPage extends Component {
  state = {
    conductores: [],
    loading: true,
    error: null,
    selectedConductor: null,
    turnos: [],
    processedTurnos: [],
    loadingTurnos: false,
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
      .catch(error => this.setState({ error: 'Error al cargar los conductores.', loading: false }));
  };

  handleIniciarTurno = async (conductorId) => {
    if (window.confirm('¿Está seguro que desea iniciar el turno para este conductor?')) {
      try {
        await iniciarTurno(conductorId);
        this.cargarConductores();
        // After starting, refresh the turnos view if a conductor is selected
        if (this.state.selectedConductor?.id === conductorId) {
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
        // After finalizing, refresh the turnos view if a conductor is selected
        if (this.state.selectedConductor?.id === conductorId) {
            this.fetchTurnosForWeek();
        }
      } catch (error) {
        console.error("Error al finalizar turno:", error.response?.data || error.message);
        alert(`Error al finalizar turno: ${error.response?.data?.error || 'Error desconocido'}`);
      }
    }
  };

  handleSelectConductor = (conductor) => {
    this.setState({ selectedConductor: conductor, weekOffset: 0 }, () => {
        this.fetchTurnosForWeek();
    });
  };

  _getWeekDateRange = (weekOffset) => {
    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    
    const dayOfWeek = refDate.getDay();
    const diff = refDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
    
    const startOfWeek = new Date(refDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 6));
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  fetchTurnosForWeek = async () => {
    const { selectedConductor, weekOffset } = this.state;
    if (!selectedConductor) return;

    this.setState({ loadingTurnos: true });

    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);

    const params = {
        conductor: selectedConductor.id,
        fecha_hora__gte: startOfWeek.toISOString(),
        fecha_hora__lte: endOfWeek.toISOString(),
    };

    try {
        const turnosData = await this.fetchAllTurnos(params);
        this.setState({ turnos: turnosData, processedTurnos: this.processTurnos(turnosData), loadingTurnos: false });
    } catch (error) {
        console.error("Error fetching turnos:", error);
        this.setState({ loadingTurnos: false });
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

  handleExportMonthly = async () => {
    const { selectedConductor, weekOffset } = this.state;
    if (!selectedConductor) return;

    this.setState({ loadingMonthlyReport: true });

    const refDate = new Date();
    refDate.setDate(refDate.getDate() + weekOffset * 7);
    
    const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    try {
      const allTurnos = await this.fetchAllTurnos({ 
          conductor: selectedConductor.id,
          fecha_hora__gte: startOfMonth.toISOString(),
          fecha_hora__lte: endOfMonth.toISOString(),
      });
      const processed = this.processTurnos(allTurnos);
      
      // Reverse back to chronological order for the PDF
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

      exportTurnosPDF(selectedConductor, turnosForPDF, reportRange);

    } catch (error) {
      console.error("Error generating monthly report:", error);
      alert("Error al generar el reporte mensual.");
    } finally {
      this.setState({ loadingMonthlyReport: false });
    }
  }

  handleExport = () => {
    const { selectedConductor, processedTurnos, weekOffset } = this.state;
    if (!selectedConductor || processedTurnos.length === 0) {
        alert('No hay turnos para exportar en la semana seleccionada.');
        return;
    }

    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);
    const weekRange = {
        start: startOfWeek.toLocaleDateString('es-ES'),
        end: endOfWeek.toLocaleDateString('es-ES')
    };

    // Reverse back to chronological order for the PDF
    const turnosForPDF = [...processedTurnos].reverse();

    exportTurnosPDF(selectedConductor, turnosForPDF, weekRange);
  }

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

  formatTimeOnly = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime = (dateStr, baseDateStr = null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    
    if (baseDateStr) {
        const baseDate = new Date(baseDateStr);
        if (date.toDateString() === baseDate.toDateString()) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
    }

    return new Date(dateStr).toLocaleString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  handleTurnoActionClick = (e, conductor) => {
    e.stopPropagation();
    if (conductor.estado_disponibilidad === 'dia_libre' || conductor.estado_disponibilidad === 'no_disponible') {
      this.handleIniciarTurno(conductor.id);
    } else {
      this.handleFinalizarTurno(conductor.id);
    }
  };

  render(_, { conductores, loading, error, selectedConductor, loadingTurnos, processedTurnos, weekOffset, editingTurnoPair, loadingMonthlyReport }) {
    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);
    const weekRange = {
        start: startOfWeek.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        end: endOfWeek.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    };

    return (
      <motion.div 
        class={style.horariosPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div class="page-header">
          <h1 class="page-title">Control de Horarios</h1>
          <p class="page-subtitle">Gestiona los turnos de los conductores y genera reportes.</p>
        </div>
        
        <div class={style.pageLayout}>
          <motion.div class={`card ${style.leftColumn}`} layout>
            <div class="card-header">
              <h3>Lista de Conductores</h3>
            </div>
            {loading && <p>Cargando...</p>}
            {error && <p class="error-message">{error}</p>}
            {!loading && !error && (
              <div class="table-container">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Conductor</th>
                      <th>Estado</th>
                      <th class="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conductores.length > 0 ? (
                      conductores.map(c => (
                        <tr
                          key={c.id}
                          onClick={() => this.handleSelectConductor(c)}
                          class={selectedConductor?.id === c.id ? style.selectedRow : ''}
                        >
                          <td>{c.nombre} {c.apellido}</td>
                          <td>
                            <span class={`status-badge ${c.estado_disponibilidad}`}>
                              {DISPONIBILIDAD_LABELS[c.estado_disponibilidad] || c.estado_disponible}
                            </span>
                          </td>
                          <td class="text-center">
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" class="text-center">No hay conductores disponibles.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
          <motion.div class={`card ${style.rightColumn}`} layout>
            {selectedConductor ? (
              <div>
                <div class={`card-header ${style.dashboardHeader}`}>
                  <div>
                    <h3>Turnos de {selectedConductor.nombre}</h3>
                    <p>Semana: {weekRange.start} - {weekRange.end}</p>
                  </div>
                  <div class={style.weekNavigator}>
                    <button class="btn btn-outline" onClick={() => this.changeWeek(-1)}>‹ Ant</button>
                    <button class="btn btn-outline" onClick={() => this.changeWeek(1)}>Sig ›</button>
                  </div>
                </div>
                {loadingTurnos ? <p>Cargando turnos...</p> : (
                  <div class={style.calendarView}>
                    {processedTurnos.length > 0 ? processedTurnos.map(p => (
                      <div key={p.start?.id || p.end.id} class={style.turnoEntry}>
                        <div class={style.turnoDate}>
                          <strong>{new Date(p.start?.fecha_hora || p.end.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</strong>
                        </div>
                        <div class={style.turnoDetails}>
                          <div class={style.turnoTimes}>
                            <span><i class="icon-login"></i> {this.formatTimeOnly(p.start?.fecha_hora)}</span>
                            <span><i class="icon-logout"></i> {this.formatTimeOnly(p.end?.fecha_hora)}</span>
                          </div>
                          <div class={style.turnoDuration}>
                            <i class="icon-clock"></i> {p.duration || 'En curso'}
                          </div>
                        </div>
                        <div class={style.turnoActions}>
                          <button title="Editar" class="btn-icon" onClick={() => this.handleEditPair(p)}>✏️</button>
                          <button title="Eliminar" class="btn-icon btn-danger" onClick={() => this.handleDeletePair(p)}>🗑️</button>
                        </div>
                      </div>
                    )) : <div class={style.noTurnos}>No hay turnos registrados para esta semana.</div>}
                  </div>
                )}
                <div class="card-footer">
                  <button class="btn btn-secondary" onClick={this.handleExport} title="Exportar a PDF Semanal">Reporte Semanal</button>
                  <button class="btn btn-success" onClick={this.handleExportMonthly} disabled={loadingMonthlyReport} title="Exportar Reporte Mensual">
                    {loadingMonthlyReport ? 'Generando...' : 'Reporte Mensual'}
                  </button>
                </div>
              </div>
            ) : (
              <div class={style.dashboardPlaceholder}>
                <i class="icon-user-check"></i>
                <p>Seleccione un conductor para ver sus turnos.</p>
              </div>
            )}
          </motion.div>
        </div>
        {editingTurnoPair && (
          <TurnoPairEditModal
            turnoPair={editingTurnoPair}
            onSave={this.handleSavePair}
            onCancel={() => this.setState({ editingTurnoPair: null })}
          />
        )}
      </motion.div>
    );
  }
}

export default HorariosPage;

