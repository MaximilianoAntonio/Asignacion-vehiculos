import { h, Component } from 'preact';
import style from './style.css';
import ConductorForm from '../../components/conductorForm';
import { getConductores, createConductor, updateConductor, deleteConductor, getTurnosByConductor } from '../../services/conductorService';
import { exportTurnosPDF, formatDate, formatTime } from '../../services/pdfExportService';

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
    turnosLoading: false,
    weekRange: null,
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
    this.setState({ detailModalConductor: conductor, turnos: [] });
  };

  handleHideDetails = () => {
    this.setState({ detailModalConductor: null, turnos: [] });
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

  handleVerTurnos = async (conductorId) => {
    this.setState({ turnosLoading: true, turnos: [] });
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Lunes como inicio
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekRange = {
      start: startOfWeek.toLocaleDateString('es-ES'),
      end: endOfWeek.toLocaleDateString('es-ES'),
    };

    try {
      const registros = await getTurnosByConductor({
        conductor: conductorId,
        fecha_hora__gte: startOfWeek.toISOString(),
        fecha_hora__lte: endOfWeek.toISOString(),
      });

      const turnosProcesados = [];
      let turnoActual = null;

      // Sort records by date ascending to correctly pair entry/exit
      registros.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

      registros.forEach(registro => {
        if (registro.tipo === 'entrada') {
          if (turnoActual) {
            turnosProcesados.push({ start: turnoActual.fecha_hora, end: null, duration: 'Incompleto' });
          }
          turnoActual = registro;
        } else if (registro.tipo === 'salida' && turnoActual) {
          const start = new Date(turnoActual.fecha_hora);
          const end = new Date(registro.fecha_hora);
          const durationMs = end - start;
          const hours = Math.floor(durationMs / 3600000);
          const minutes = Math.floor((durationMs % 3600000) / 60000);
          turnosProcesados.push({ start, end, duration: `${hours}h ${minutes}m` });
          turnoActual = null;
        }
      });

      if (turnoActual) {
        turnosProcesados.push({ start: turnoActual.fecha_hora, end: null, duration: 'En curso' });
      }

      this.setState({ turnos: turnosProcesados, weekRange, turnosLoading: false });
    } catch (error) {
      console.error("Error al cargar los turnos:", error);
      alert('Error al cargar los turnos del conductor.');
      this.setState({ turnosLoading: false });
    }
  };

  renderTable() {
    const { conductores, loading, error } = this.state;

    if (loading) return <p>Cargando conductores...</p>;
    if (error) return <p class="error-message">{error}</p>;

    return (
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>RUN</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Disponibilidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.length === 0 ? (
              <tr><td colSpan="5">No hay conductores registrados.</td></tr>
            ) : conductores.map(c => (
              <tr key={c.id} class="slide-in-up">
                <td data-label="RUN">{c.run || '—'}</td>
                <td data-label="Nombre">{c.nombre}</td>
                <td data-label="Apellido">{c.apellido}</td>
                <td data-label="Disponibilidad">
                  <span class={`${style.statusBadge} ${style[c.estado_disponibilidad]}`}>
                    {DISPONIBILIDAD_LABELS[c.estado_disponibilidad] || c.estado_disponibilidad}
                  </span>
                </td>
                <td data-label="Acciones">
                  <button onClick={() => this.handleViewDetails(c)} class="button button-outline" style={{ marginRight: '0.5rem' }}>Ver</button>
                  <button onClick={() => this.handleEdit(c)} class="button button-outline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderDetailModal() {
    const { detailModalConductor, turnos, turnosLoading, weekRange } = this.state;

    if (!detailModalConductor) return null;

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
              <p><strong>Disponibilidad:</strong> <span class={`${style.statusBadge} ${style[detailModalConductor.estado_disponibilidad]}`}>{DISPONIBILIDAD_LABELS[detailModalConductor.estado_disponibilidad] || detailModalConductor.estado_disponibilidad}</span></p>
              <p><strong>Tipos Vehículo:</strong> {detailModalConductor.tipos_vehiculo_habilitados}</p>
            </div>
          </div>

          <div class={style.turnosSection}>
            <h4 class={style.turnosTitle}>Turnos de la Semana ({weekRange ? `${weekRange.start} - ${weekRange.end}` : ''})</h4>
            <div class={style.turnosActions}>
              <button onClick={() => this.handleVerTurnos(detailModalConductor.id)} disabled={turnosLoading} class="button button-secondary">
                {turnosLoading ? 'Cargando...' : 'Cargar Turnos'}
              </button>
              {turnos.length > 0 && (
                <button onClick={() => exportTurnosPDF(detailModalConductor, turnos, weekRange)} class="button button-outline" style={{marginLeft: '10px'}}>
                  Exportar PDF
                </button>
              )}
            </div>
            {turnosLoading && <p>Cargando turnos...</p>}
            {turnos.length > 0 && !turnosLoading && (
              <div class="table-container" style={{marginTop: '1rem'}}>
                <table class="table">
                  <thead>
                    <tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Duración</th></tr>
                  </thead>
                  <tbody>
                    {turnos.map(t => (
                      <tr key={t.start}>
                        <td>{formatDate(t.start)}</td>
                        <td>{formatTime(t.start)}</td>
                        <td>{t.end ? formatTime(t.end) : '—'}</td>
                        <td>{t.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
             {turnos.length === 0 && !turnosLoading && weekRange && <p>No hay turnos registrados para esta semana.</p>}
          </div>

          <div class={style.modalActions}>
            <button onClick={() => this.handleEdit(detailModalConductor)} class="button button-primary">Editar</button>
            <button onClick={() => this.handleDelete(detailModalConductor.id)} class="button button-danger">Eliminar</button>
          </div>
        </div>
      </div>
    );
  }

  renderContent = () => {
    const { conductores, loading, error } = this.state;

    if (loading) return <p>Cargando...</p>;
    if (error) return <p class="error-message">{error}</p>;

    return this.renderTable();
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
          <h1 class="page-title">Gestión de Conductores</h1>
          <button onClick={this.handleAddNew} class="button button-primary">
            <i class="fas fa-plus" style={{marginRight: '0.5rem'}}></i> Nuevo Conductor
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
          {this.renderContent()}
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
