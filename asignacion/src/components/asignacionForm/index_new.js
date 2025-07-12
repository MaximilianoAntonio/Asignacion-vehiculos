import { h, Component } from 'preact';
import { createAsignacion, updateAsignacion } from '../../services/asignacionService';

// Lazy loading de Leaflet
const loadLeaflet = async () => {
  const [leafletCSS, L] = await Promise.all([
    import('leaflet/dist/leaflet.css'),
    import('leaflet')
  ]);
  
  window.L = L.default;
  return L.default;
};

let origenIcon, destinoIcon;

const getIcons = async () => {
  if (origenIcon && destinoIcon) return { origenIcon, destinoIcon };
  
  const L = await loadLeaflet();
  
  origenIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="blue" /></svg>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
  
  destinoIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="red" /></svg>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
  
  return { origenIcon, destinoIcon };
};

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

class AsignacionForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Campos principales
      req_tipo_vehiculo_preferente: '',
      vehiculo: '',
      conductor: '',
      fecha_hora_requerida_inicio: '',
      fecha_hora_fin_prevista: '',
      req_pasajeros: 1,
      estado: 'pendiente',
      
      // Información del solicitante
      solicitante_jerarquia: '0',
      solicitante_nombre: '',
      solicitante_telefono: '',
      responsable_nombre: '',
      responsable_telefono: '',
      
      // Ubicaciones
      origen_descripcion: '',
      destino_descripcion: '',
      req_caracteristicas_especiales: '',
      
      // Estado del formulario
      submitting: false,
      error: null,
      errores: null,
      
      // Mapa y sugerencias
      origen_calle_sugerencias: [],
      destino_calle_sugerencias: [],
      distancia: null
    };
    
    this.map = null;
    this.origenMarker = null;
    this.destinoMarker = null;
    this.routeControl = null;
    
    this.handleCalleInputChange = debounce(this.handleCalleInputChange.bind(this), 300);
  }

  componentDidMount() {
    this.initializeForm();
    this.initializeMap();
  }

  initializeForm() {
    const { asignacion } = this.props;
    if (asignacion) {
      this.setState({
        req_tipo_vehiculo_preferente: asignacion.req_tipo_vehiculo_preferente || '',
        vehiculo: asignacion.vehiculo?.id || '',
        conductor: asignacion.conductor?.id || '',
        fecha_hora_requerida_inicio: asignacion.fecha_hora_requerida_inicio ? 
          new Date(asignacion.fecha_hora_requerida_inicio).toISOString().slice(0, 16) : '',
        fecha_hora_fin_prevista: asignacion.fecha_hora_fin_prevista ? 
          new Date(asignacion.fecha_hora_fin_prevista).toISOString().slice(0, 16) : '',
        req_pasajeros: asignacion.req_pasajeros || 1,
        estado: asignacion.estado || 'pendiente',
        solicitante_jerarquia: asignacion.solicitante_jerarquia?.toString() || '0',
        solicitante_nombre: asignacion.solicitante_nombre || '',
        solicitante_telefono: asignacion.solicitante_telefono || '',
        responsable_nombre: asignacion.responsable_nombre || '',
        responsable_telefono: asignacion.responsable_telefono || '',
        origen_descripcion: asignacion.origen_descripcion || '',
        destino_descripcion: asignacion.destino_descripcion || '',
        req_caracteristicas_especiales: asignacion.req_caracteristicas_especiales || ''
      });
    }
  }

  async initializeMap() {
    try {
      const L = await loadLeaflet();
      
      if (this.map) {
        this.map.remove();
      }
      
      this.map = L.map('map').setView([-33.047, -71.617], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleCalleInputChange = async (tipo, e) => {
    const query = e.target.value;
    this.setState({ [`${tipo}_descripcion`]: query });
    
    if (query.length < 3) {
      this.setState({ [`${tipo}_calle_sugerencias`]: [] });
      return;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Valparaíso, Chile')}&limit=5`
      );
      const data = await response.json();
      this.setState({ [`${tipo}_calle_sugerencias`]: data });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }

  handleSuggestionClick = async (tipo, suggestion) => {
    this.setState({
      [`${tipo}_descripcion`]: suggestion.display_name,
      [`${tipo}_calle_sugerencias`]: []
    });
    
    if (!this.map) return;
    
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    const L = await loadLeaflet();
    const { origenIcon, destinoIcon } = await getIcons();
    
    if (tipo === 'origen') {
      if (this.origenMarker) {
        this.map.removeLayer(this.origenMarker);
      }
      this.origenMarker = L.marker([lat, lon], { icon: origenIcon }).addTo(this.map);
    } else {
      if (this.destinoMarker) {
        this.map.removeLayer(this.destinoMarker);
      }
      this.destinoMarker = L.marker([lat, lon], { icon: destinoIcon }).addTo(this.map);
    }
    
    this.calculateRoute();
  }

  calculateRoute = async () => {
    if (!this.origenMarker || !this.destinoMarker || !this.map) return;
    
    try {
      const origenLatLng = this.origenMarker.getLatLng();
      const destinoLatLng = this.destinoMarker.getLatLng();
      
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origenLatLng.lng},${origenLatLng.lat};${destinoLatLng.lng},${destinoLatLng.lat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(2);
        this.setState({ distancia: `${distanceKm} km` });
        
        const L = await loadLeaflet();
        
        if (this.routeControl) {
          this.map.removeLayer(this.routeControl);
        }
        
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        this.routeControl = L.polyline(coordinates, { color: 'blue', weight: 4 }).addTo(this.map);
        
        const group = new L.featureGroup([this.origenMarker, this.destinoMarker, this.routeControl]);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    
    this.setState({ submitting: true, error: null, errores: null });
    
    try {
      const formData = {
        req_tipo_vehiculo_preferente: this.state.req_tipo_vehiculo_preferente,
        vehiculo: this.state.vehiculo || null,
        conductor: this.state.conductor || null,
        fecha_hora_requerida_inicio: this.state.fecha_hora_requerida_inicio,
        fecha_hora_fin_prevista: this.state.fecha_hora_fin_prevista || null,
        req_pasajeros: parseInt(this.state.req_pasajeros),
        estado: this.state.estado,
        solicitante_jerarquia: parseInt(this.state.solicitante_jerarquia),
        solicitante_nombre: this.state.solicitante_nombre,
        solicitante_telefono: this.state.solicitante_telefono,
        responsable_nombre: this.state.responsable_nombre,
        responsable_telefono: this.state.responsable_telefono,
        origen_descripcion: this.state.origen_descripcion,
        destino_descripcion: this.state.destino_descripcion,
        req_caracteristicas_especiales: this.state.req_caracteristicas_especiales
      };
      
      if (this.props.asignacion) {
        await updateAsignacion(this.props.asignacion.id, formData);
      } else {
        await createAsignacion(formData);
      }
      
      if (this.props.onAsignacionCreada) {
        this.props.onAsignacionCreada();
      }
      
    } catch (error) {
      if (error.response && error.response.data) {
        this.setState({ errores: error.response.data });
      } else {
        this.setState({ error: error.message || 'Error al procesar la asignación' });
      }
    } finally {
      this.setState({ submitting: false });
    }
  }

  render() {
    const { props } = this;
    const { 
      vehiculosDisponibles = [], 
      conductoresDisponibles = [],
      userGroup 
    } = props;
    
    const isFuncionario = userGroup === 'funcionario';
    
    const tipoVehiculoChoices = [
      { value: '', label: '-- Seleccionar --' },
      { value: 'sedan', label: 'Sedán' },
      { value: 'hatchback', label: 'Hatchback' },
      { value: 'suv', label: 'SUV' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'van', label: 'Van' },
      { value: 'camion', label: 'Camión' }
    ];
    
    const estadoChoices = [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'aprobada', label: 'Aprobada' },
      { value: 'en_curso', label: 'En Curso' },
      { value: 'completada', label: 'Completada' },
      { value: 'cancelada', label: 'Cancelada' }
    ];
    
    let vehiculosFiltrados = vehiculosDisponibles;
    if (this.state.req_tipo_vehiculo_preferente) {
      vehiculosFiltrados = vehiculosDisponibles.filter(v => 
        v.tipo_vehiculo === this.state.req_tipo_vehiculo_preferente
      );
    }

    return (
      <div>
        <div class="card-header">
          <h3 class="card-title">
            {props.asignacion ? 'Editar Asignación' : 'Nueva Asignación'}
          </h3>
        </div>
        
        {this.state.error && (
          <div style="background: var(--danger-light); color: var(--danger-dark); padding: 1rem; border-radius: var(--border-radius); margin: 1.5rem 1.5rem 0;">
            {this.state.error}
          </div>
        )}
        
        {this.state.errores && (
          <div style="background: var(--danger-light); color: var(--danger-dark); padding: 1rem; border-radius: var(--border-radius); margin: 1.5rem 1.5rem 0;">
            {Object.entries(this.state.errores).map(([campo, mensajes]) =>
              mensajes.map(msg => (
                <div key={`${campo}-${msg}`}>
                  {campo !== 'general' ? `${campo}: ` : ''}{msg}
                </div>
              ))
            )}
          </div>
        )}
        
        <form onSubmit={this.handleSubmit} style="padding: 1.5rem;">
          <div class="form-grid">
            {!isFuncionario && (
              <>
                <div class="form-group">
                  <label for="req_tipo_vehiculo_preferente">Tipo Vehículo Preferente (opcional)</label>
                  <select 
                    name="req_tipo_vehiculo_preferente" 
                    id="req_tipo_vehiculo_preferente" 
                    class="form-control"
                    value={this.state.req_tipo_vehiculo_preferente} 
                    onInput={this.handleChange}
                  >
                    {tipoVehiculoChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label for="vehiculo">Vehículo (Opcional)</label>
                  <select 
                    name="vehiculo" 
                    id="vehiculo" 
                    class="form-control"
                    value={this.state.vehiculo} 
                    onInput={this.handleChange}
                  >
                    <option value="">-- Seleccionar Vehículo --</option>
                    {vehiculosFiltrados.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} ({v.patente}) - {v.estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label for="conductor">Conductor (Opcional)</label>
                  <select 
                    name="conductor" 
                    id="conductor" 
                    class="form-control"
                    value={this.state.conductor} 
                    onInput={this.handleChange}
                  >
                    <option value="">-- Seleccionar Conductor --</option>
                    {conductoresDisponibles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido} ({c.estado_disponibilidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label for="fecha_hora_requerida_inicio">Fecha y Hora Requerida Inicio</label>
                  <input 
                    type="datetime-local" 
                    name="fecha_hora_requerida_inicio" 
                    id="fecha_hora_requerida_inicio"
                    class="form-control"
                    value={this.state.fecha_hora_requerida_inicio} 
                    onInput={this.handleChange} 
                    required 
                  />
                </div>

                <div class="form-group">
                  <label for="fecha_hora_fin_prevista">Fecha y Hora Fin Prevista (opcional)</label>
                  <input 
                    type="datetime-local" 
                    name="fecha_hora_fin_prevista" 
                    id="fecha_hora_fin_prevista"
                    class="form-control"
                    value={this.state.fecha_hora_fin_prevista} 
                    onInput={this.handleChange} 
                  />
                </div>

                <div class="form-group">
                  <label for="req_pasajeros">Nº Pasajeros</label>
                  <input 
                    type="number" 
                    name="req_pasajeros" 
                    id="req_pasajeros" 
                    class="form-control"
                    value={this.state.req_pasajeros}
                    onInput={this.handleChange} 
                    min="1" 
                    required 
                  />
                </div>

                <div class="form-group">
                  <label for="estado">Estado</label>
                  <select 
                    name="estado" 
                    id="estado" 
                    class="form-control"
                    value={this.state.estado} 
                    onInput={this.handleChange}
                  >
                    {estadoChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label for="solicitante_jerarquia">Jerarquía del Solicitante</label>
                  <select 
                    name="solicitante_jerarquia" 
                    id="solicitante_jerarquia" 
                    class="form-control"
                    value={this.state.solicitante_jerarquia}
                    onInput={this.handleChange}
                  >
                    <option value="0">Otro/No especificado</option>
                    <option value="1">Funcionario</option>
                    <option value="2">Coordinación/Referente</option>
                    <option value="3">Jefatura/Subdirección</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="solicitante_nombre">Nombre del Solicitante</label>
                  <input 
                    type="text" 
                    name="solicitante_nombre" 
                    id="solicitante_nombre" 
                    class="form-control"
                    value={this.state.solicitante_nombre}
                    onInput={this.handleChange} 
                  />
                </div>

                <div class="form-group">
                  <label for="solicitante_telefono">Teléfono del Solicitante</label>
                  <input 
                    type="text" 
                    name="solicitante_telefono" 
                    id="solicitante_telefono" 
                    class="form-control"
                    value={this.state.solicitante_telefono}
                    onInput={this.handleChange} 
                  />
                </div>

                <div class="form-group">
                  <label for="responsable_nombre">Nombre del Responsable</label>
                  <input 
                    type="text" 
                    name="responsable_nombre" 
                    id="responsable_nombre" 
                    class="form-control"
                    value={this.state.responsable_nombre}
                    onInput={this.handleChange} 
                  />
                </div>

                <div class="form-group">
                  <label for="responsable_telefono">Teléfono del Responsable</label>
                  <input 
                    type="text" 
                    name="responsable_telefono" 
                    id="responsable_telefono" 
                    class="form-control"
                    value={this.state.responsable_telefono}
                    onInput={this.handleChange} 
                  />
                </div>
              </>
            )}

            <fieldset class="form-group full-width">
              <legend>Origen (Región: Valparaíso)</legend>
              <label for="origen_descripcion">Descripción</label>
              <input 
                type="text" 
                name="origen_descripcion" 
                id="origen_descripcion"
                class="form-control"
                value={this.state.origen_descripcion}
                onInput={e => this.handleCalleInputChange('origen', e)}
                autoComplete="off" 
                placeholder="Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc." 
              />
              {this.state.origen_calle_sugerencias.length > 0 && (
                <ul class="suggestions-list">
                  {this.state.origen_calle_sugerencias.map(sug => (
                    <li key={sug.place_id || sug.osm_id} onClick={() => this.handleSuggestionClick('origen', sug)}>
                      {sug.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <fieldset class="form-group full-width">
              <legend>Destino (Región: Valparaíso)</legend>
              <label for="destino_descripcion">Descripción</label>
              <input 
                type="text" 
                name="destino_descripcion" 
                id="destino_descripcion"
                class="form-control"
                value={this.state.destino_descripcion}
                onInput={e => this.handleCalleInputChange('destino', e)}
                autoComplete="off" 
                placeholder="Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc." 
              />
              {this.state.destino_calle_sugerencias.length > 0 && (
                <ul class="suggestions-list">
                  {this.state.destino_calle_sugerencias.map(sug => (
                    <li key={sug.place_id || sug.osm_id} onClick={() => this.handleSuggestionClick('destino', sug)}>
                      {sug.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <div class="form-group full-width">
              <div class="mapContainer">
                <div id="map" style="height: 100%; width: 100%;" />
                {this.state.distancia && (
                  <p style="margin-top: 0.5rem; color: var(--neutral-600);">
                    Distancia estimada: {this.state.distancia}
                  </p>
                )}
              </div>
            </div>

            <div class="form-group full-width">
              <label for="req_caracteristicas_especiales">Requerimientos Especiales (opcional)</label>
              <textarea 
                name="req_caracteristicas_especiales" 
                id="req_caracteristicas_especiales"
                class="form-control"
                value={this.state.req_caracteristicas_especiales} 
                onInput={this.handleChange} 
                rows="3"
              />
            </div>

            <div class="form-group full-width">
              <div class="card-footer">
                <button 
                  type="button" 
                  onClick={props.onCancel} 
                  class="btn btn-secondary" 
                  disabled={this.state.submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={this.state.submitting} 
                  class="btn btn-primary"
                >
                  {this.state.submitting ? 
                    (props.asignacion ? 'Actualizando...' : 'Creando...') : 
                    (props.asignacion ? 'Actualizar Asignación' : 'Guardar')
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default AsignacionForm;
