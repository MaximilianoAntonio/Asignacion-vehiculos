import { h, Component } from 'preact';
import style from './style.css';
import { getConductores, iniciarTurno, finalizarTurno } from '../../services/conductorService';
import { getTurnos, updateTurno, deleteTurno } from '../../services/turnoService';
import { exportTurnosPDF } from '../../services/pdfExportService';
import TurnoEditModal from '../../components/turnoEditModal';

const DISPONIBILIDAD_LABELS = {
  disponible: 'Disponible',
  en_ruta: 'En Ruta',
  dia_libre: 'Día Libre',
  no_disponible: 'No Disponible'
};

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
    editingTurno: null,
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
      
      const turnosForPDF = processed.map(p => ({
          start: p.start?.fecha_hora,
          end: p.end?.fecha_hora,
          duration: p.duration
      })).reverse();

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
    if (!selectedConductor || processedTurnos.length === 0) return;

    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);
    const weekRange = {
        start: startOfWeek.toLocaleDateString('es-ES'),
        end: endOfWeek.toLocaleDateString('es-ES')
    };

    const turnosForPDF = processedTurnos.map(p => ({
        start: p.start?.fecha_hora,
        end: p.end?.fecha_hora,
        duration: p.duration
    })).reverse(); // Reverse back to chronological order for the PDF

    exportTurnosPDF(selectedConductor, turnosForPDF, weekRange);
  }

  handleEdit = (turnoRecord) => {
    this.setState({ editingTurno: turnoRecord });
  };

  handleDelete = async (turnoId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro de turno? Esta acción no se puede deshacer.')) {
        try {
            await deleteTurno(turnoId);
            this.fetchTurnosForWeek(); // Recargar
        } catch (error) {
            alert('Error al eliminar el registro.');
        }
    }
  };

  handleSaveEdit = async (turnoId, data) => {
    try {
        await updateTurno(turnoId, data);
        this.setState({ editingTurno: null });
        this.fetchTurnosForWeek();
    } catch (error) {
        alert('Error al guardar los cambios.');
    }
  };

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

  render(_, { conductores, loading, error, selectedConductor, loadingTurnos, processedTurnos, weekOffset, editingTurno, loadingMonthlyReport }) {
    const { startOfWeek, endOfWeek } = this._getWeekDateRange(weekOffset);
    const weekRange = {
        start: startOfWeek.toLocaleDateString('es-ES'),
        end: endOfWeek.toLocaleDateString('es-ES')
    };

    return (
      <div class={style.horariosPage}>
        <h1>Control de Horarios de Conductores</h1>
        
        <div class={style.pageLayout}>
          <div class={style.leftColumn}>
            {loading && <p>Cargando...</p>}
            {error && <p class={style.error}>{error}</p>}
            {!loading && !error && (
              <table class={style.table}>
                <thead>
                  <tr>
                    <th>Conductor</th>
                    <th>Estado Actual</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {conductores.length > 0 ? (
                    conductores.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => this.handleSelectConductor(c)}
                        class={`${style.clickableRow} ${selectedConductor?.id === c.id ? style.selectedRow : ''}`}
                      >
                        <td>{c.nombre} {c.apellido}</td>
                        <td>
                          <span class={`${style.status} ${style[c.estado_disponibilidad]}`}>
                            {DISPONIBILIDAD_LABELS[c.estado_disponibilidad] || c.estado_disponible}
                          </span>
                        </td>
                        <td>
                          {c.estado_disponibilidad === 'en_ruta' ? (
                            <button class={`${style.button} ${style.buttonDisabled}`} disabled>
                              En Ruta
                            </button>
                          ) : (
                            <button
                              class={`${style.button} ${
                                c.estado_disponibilidad === 'dia_libre' || c.estado_disponibilidad === 'no_disponible'
                                  ? style.buttonStart
                                  : style.buttonEnd
                              }`}
                              onClick={e => this.handleTurnoActionClick(e, c)}
                            >
                              {c.estado_disponibilidad === 'dia_libre' || c.estado_disponibilidad === 'no_disponible'
                                ? 'Iniciar Turno'
                                : 'Finalizar Turno'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center' }}>No hay conductores disponibles.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div class={style.rightColumn}>
            {selectedConductor ? (
              <div>
                <div class={style.dashboardHeader}>
                  <div>
                    <h2>Turnos de {selectedConductor.nombre} {selectedConductor.apellido}</h2>
                    <p>Semana del {weekRange.start} al {weekRange.end}</p>
                  </div>
                  <div class={style.weekNavigator}>
                    <button onClick={() => this.changeWeek(-1)} title="Semana Anterior">‹ Ant</button>
                    <button onClick={() => this.changeWeek(1)} title="Semana Siguiente">Sig ›</button>
                    <button class={style.exportButton} onClick={this.handleExport} title="Exportar a PDF Semanal">PDF Semanal</button>
                    <button class={style.exportButton} onClick={this.handleExportMonthly} disabled={loadingMonthlyReport} title="Exportar Reporte Mensual">
                      {loadingMonthlyReport ? 'Generando...' : 'PDF Mensual'}
                    </button>
                  </div>
                </div>
                {loadingTurnos ? <p>Cargando turnos...</p> : (
                  <table class={style.turnosTable}>
                    <thead>
                      <tr>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Duración</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedTurnos.length > 0 ? processedTurnos.map(p => (
                        <tr key={p.start?.id || p.end.id}>
                          <td>{this.formatDateTime(p.start?.fecha_hora)}</td>
                          <td>{this.formatDateTime(p.end?.fecha_hora, p.start?.fecha_hora)}</td>
                          <td>{p.duration || 'N/A'}</td>
                          <td class={style.turnoActions}>
                            {p.start && <button title="Editar Inicio" class={style.editButton} onClick={() => this.handleEdit(p.start)}>✏️</button>}
                            {p.start && <button title="Eliminar Inicio" class={style.deleteButton} onClick={() => this.handleDelete(p.start.id)}>🗑️</button>}
                            {p.end && <button title="Editar Fin" class={style.editButton} onClick={() => this.handleEdit(p.end)}>✏️</button>}
                            {p.end && <button title="Eliminar Fin" class={style.deleteButton} onClick={() => this.handleDelete(p.end.id)}>🗑️</button>}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center' }}>No hay registros de turno para esta semana.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div class={style.dashboardPlaceholder}>
                <p>Seleccione un conductor para ver sus turnos.</p>
              </div>
            )}
          </div>
        </div>
        {editingTurno && (
          <TurnoEditModal
            turno={editingTurno}
            onSave={this.handleSaveEdit}
            onCancel={() => this.setState({ editingTurno: null })}
          />
        )}
      </div>
    );
  }
}

export default HorariosPage;

