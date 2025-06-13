import { h, Component } from 'preact';
import style from './style.css';
import ConductorForm from '../../components/conductorForm';
import { getConductores, createConductor, updateConductor, deleteConductor } from '../../services/conductorService';

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
    this.setState({ detailModalConductor: conductor });
  };

  handleHideDetails = () => {
    this.setState({ detailModalConductor: null });
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

  render(_, { conductores, loading, error, formMode, selectedConductor, detailModalConductor }) {
    // Contar conductores por estado de disponibilidad
    const conductoresPorEstado = conductores.reduce((acc, c) => {
        acc[c.estado_disponibilidad] = (acc[c.estado_disponibilidad] || 0) + 1;
        return acc;
    }, {});

    return (
        <div class={style.conductoresPage}>
            <h1>Gestión de Conductores</h1>
            {/* Los contadores deben ir aquí, antes del layout */}
            <div class={style.estadoCounters}>
                <span class={style.estadoDisponible}>
                    Disponible: {conductoresPorEstado['disponible'] || 0}
                </span>
                <span class={style.estadoEnRuta}>
                    En Ruta: {conductoresPorEstado['en_ruta'] || 0}
                </span>
                <span class={style.estadoDiaLibre}>
                    Día Libre: {conductoresPorEstado['dia_libre'] || 0}
                </span>
                <span class={style.estadoNoDisponible}>
                    No Disponible: {conductoresPorEstado['no_disponible'] || 0}
                </span>
            </div>
            <div class={style.pageLayout}>
                <div class={style.leftColumn}>
                <button onClick={this.handleAddNew} class={style.addButton}>
                  Agregar Nuevo Conductor
                </button>
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
                    <tr><td colspan="9">Cargando conductores...</td></tr>
                  ) : error ? (
                    <tr><td colspan="9">{error}</td></tr>
                  ) : conductores.length === 0 ? (
                    <tr><td colspan="9">No hay conductores registrados.</td></tr>
                  ) : conductores.map(c => (
                    <tr key={c.id} onClick={() => this.handleViewDetails(c)} class={style.clickableRow}>
                    <td>{c.nombre}</td>
                    <td>{c.apellido}</td>
                    <td>
                      {c.foto_url ? (
                      <img
                        src={`${c.foto_url}`}
                        style={{ width: '100px', height: 'auto', objectFit: 'contain' }}
                      />
                      ) : (
                      'Sin foto'
                      )}
                    </td>
                    <td>{c.telefono || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td class={
    c.estado_disponibilidad === 'disponible' ? style.estadoDisponible :
    c.estado_disponibilidad === 'en_ruta' ? style.estadoEnRuta :
    c.estado_disponibilidad === 'dia_libre' ? style.estadoDiaLibre :
    c.estado_disponibilidad === 'no_disponible' ? style.estadoNoDisponible : ''
  }>
    {DISPONIBILIDAD_LABELS[c.estado_disponibilidad] || c.estado_disponibilidad}
  </td>
                    <td>{c.tipos_vehiculo_habilitados}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
                </div>
                <div class={style.rightColumn}>
                {formMode ? (
                  <div class={style.formContainer}>
                  <h2>{formMode === 'edit' ? 'Editar Conductor' : 'Agregar Conductor'}</h2>
                  <ConductorForm
                    conductor={selectedConductor}
                    onSave={this.handleSave}
                    onUpdate={this.handleUpdate}
                    onCancel={this.resetFormState}
                  />
                  </div>
                ) : (
                  <div class={style.formPlaceholder}>
                  <p>Seleccione "Agregar Nuevo Conductor" o haga clic en una fila para ver sus detalles y editar.</p>
                  </div>
                )}
                </div>
            </div>

            {detailModalConductor && (
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
                </div>
              </div>
              </div>
            )}
        </div>
    );
  }
}

export default ConductoresPage;
