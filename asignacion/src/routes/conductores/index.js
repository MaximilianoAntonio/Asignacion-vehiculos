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

    return (
      <div class={style.responsiveTableWrapper}>
        <table class={style.dataTable}>
          <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Foto</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Disponibilidad</th>
            <th>Tipos Vehículo</th>
          </tr>
          </thead>
          <tbody>
          {loading ? (
            <tr><td colSpan="9">Cargando conductores...</td></tr>
          ) : error ? (
            <tr><td colSpan="9">{error}</td></tr>
          ) : conductores.length === 0 ? (
            <tr><td colSpan="9">No hay conductores registrados.</td></tr>
          ) : conductores.map(c => (
            <tr key={c.id} onClick={() => this.handleViewDetails(c)} class={style.clickableRow}>
              <td data-label="Nombre">{c.nombre}</td>
              <td data-label="Apellido">{c.apellido}</td>
              <td data-label="Foto">
                {c.foto_url ? (
                  <img
                    src={`${c.foto_url}`}
                    style={{ width: '100px', height: 'auto', objectFit: 'contain' }}
                  />
                ) : (
                  'Sin foto'
                )}
              </td>
              <td data-label="Teléfono">{c.telefono || '—'}</td>
              <td data-label="Email">{c.email || '—'}</td>
              <td data-label="Disponibilidad" class={
                c.estado_disponibilidad === 'disponible' ? style.estadoDisponible :
                c.estado_disponibilidad === 'en_ruta' ? style.estadoEnRuta :
                c.estado_disponibilidad === 'dia_libre' ? style.estadoDiaLibre :
                c.estado_disponibilidad === 'no_disponible' ? style.estadoNoDisponible : ''
              }>
                {DISPONIBILIDAD_LABELS[c.estado_disponibilidad] || c.estado_disponibilidad}
              </td>
              <td data-label="Tipos Vehículo">{c.tipos_vehiculo_habilitados}</td>
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
        <div
          class={style.modalContent}
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '32px' }}
        >
          <div
          class={style.modalImageContainer}
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}
          >
          <img
            src={detailModalConductor.foto_url ? `${detailModalConductor.foto_url}` : 'https://th.bing.com/th/id/OIP.5_RqTlUhvMdpCjGOhOmTdQHaHa?rs=1&pid=ImgDetMain'}
            alt="Conductor"
            style={{ width: '250px', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
          </div>
          <div style={{ flex: '1 1 0%' }}>
          <button class={style.modalCloseButton} onClick={this.handleHideDetails}>×</button>
          <h2>Información del Conductor</h2>
          <div class={style.modalDetails}>
            <p><strong>Nombre:</strong> {detailModalConductor.nombre} {detailModalConductor.apellido}</p>
            <p><strong>N° Licencia:</strong> {detailModalConductor.numero_licencia}</p>
            <p><strong>Vencimiento:</strong> {detailModalConductor.fecha_vencimiento_licencia}</p>
            <p><strong>Teléfono:</strong> {detailModalConductor.telefono || '—'}</p>
            <p><strong>Email:</strong> {detailModalConductor.email || '—'}</p>
            <p><strong>Disponibilidad:</strong> {DISPONIBILIDAD_LABELS[detailModalConductor.estado_disponibilidad] || detailModalConductor.estado_disponibilidad}</p>
            <p><strong>Tipos Vehículo:</strong> {detailModalConductor.tipos_vehiculo_habilitados}</p>
          </div>
          <div class={style.modalActions}>
            <button onClick={() => this.handleEdit(detailModalConductor)} class={style.editButton}>Editar</button>
            <button onClick={() => this.handleDelete(detailModalConductor.id)} class={style.deleteButton}>Eliminar</button>
          </div>
          <div class={style.turnosSection}>
            <hr style={{margin: '20px 0'}} />
            <h4>Turnos de la Semana ({weekRange ? `${weekRange.start} - ${weekRange.end}` : ''})</h4>
            <button onClick={() => this.handleVerTurnos(detailModalConductor.id)} disabled={turnosLoading} class={style.actionButton}>
              {turnosLoading ? 'Cargando...' : 'Cargar Turnos'}
            </button>
            {turnos.length > 0 && (
              <button onClick={() => exportTurnosPDF(detailModalConductor, turnos, weekRange)} class={style.exportButton} style={{marginLeft: '10px'}}>
                Exportar PDF
              </button>
            )}
            {turnosLoading && <p>Cargando turnos...</p>}
            {turnos.length > 0 && !turnosLoading && (
              <table class={style.turnosTable}>
                <thead>
                  <tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Duración</th></tr>
                </thead>
                <tbody>
                  {turnos.map(t => (
                    <tr>
                      <td>{formatDate(t.start)}</td>
                      <td>{formatTime(t.start)}</td>
                      <td>{t.end ? formatTime(t.end) : '—'}</td>
                      <td>{t.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
             {turnos.length === 0 && !turnosLoading && weekRange && <p>No hay turnos registrados para esta semana.</p>}
          </div>
          </div>
        </div>
        </div>
      );
  }

  renderContent = () => {
    const { conductores, loading, error, formMode, selectedConductor, detailModalConductor } = this.state;

    if (loading) return <p>Cargando...</p>;
    if (error) return <p class={style.errorMsg}>{error}</p>;

    return (
      <div class={style.leftColumn}>
        <button onClick={this.handleAddNew} class={style.addButton}>
          <i class="fas fa-plus"></i> Nuevo Conductor
        </button>
        {this.renderTable()}
      </div>
    );
  }

  render() {
    const { formMode, selectedConductor } = this.state;

    return (
      <div class={style.conductoresPage}>
        <h1>Gestión de Conductores</h1>
        <div class={style.pageLayout}>
          {this.renderContent()}
        </div>

        {formMode && (
          <ConductorForm
            conductor={selectedConductor}
            onSave={formMode === 'add' ? this.handleSave : (id, data) => this.handleUpdate(id, data)}
            onCancel={this.resetFormState}
            formMode={formMode}
          />
        )}

        {this.renderDetailModal()}
      </div>
    );
  }
}

export default ConductoresPage;
