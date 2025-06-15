import { h, Component } from 'preact';
import formStyle from './style.css';
import { createAsignacion, updateAsignacion } from '../../services/asignacionService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
window.L = L;

const origenIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="blue" /></svg>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});
const destinoIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="red" /></svg>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});

const REGION_VALPARAISO = "Región de Valparaíso";

// Debounce helper
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

class AsignacionForm extends Component {
  initialState = {
    vehiculo_id: '',
    conductor_id: '',
    destino_descripcion: 'Destino pendiente',
    origen_descripcion: '',
    fecha_hora_solicitud: '',
    fecha_hora_requerida_inicio: '',
    req_pasajeros: 1,
    req_tipo_vehiculo_preferente: '',
    req_caracteristicas_especiales: '',
    observaciones: '',
    origen_lat: null,
    origen_lon: null,
    destino_lat: null,
    destino_lon: null,
    fecha_hora_fin_prevista: '',
    fecha_hora_fin_real: '',
    estado: 'pendiente_auto',
    solicitante_jerarquia: 0,
    solicitante_nombre: '',
    solicitante_telefono: '',
    origen_calle_sugerencias: [],
    destino_calle_sugerencias: [],
    ruta: null,
    distancia: null,
    errores: null,
    submitting: false,
  };

  map = null;
  routeLayer = null;

  constructor(props) {
    super(props);
    this.state = {
      ...this.initialState,
      ...(props.asignacion ? {
        vehiculo_id: props.asignacion.vehiculo?.id || '',
        conductor_id: props.asignacion.conductor?.id || '',
        origen_descripcion: props.asignacion.origen_descripcion || '',
        destino_descripcion: props.asignacion.destino_descripcion || 'Destino pendiente',
        fecha_hora_requerida_inicio: props.asignacion.fecha_hora_requerida_inicio ? props.asignacion.fecha_hora_requerida_inicio.slice(0, 16) : '',
        req_pasajeros: (typeof props.asignacion.req_pasajeros === 'number') ? props.asignacion.req_pasajeros : 1,
        req_tipo_vehiculo_preferente: props.asignacion.req_tipo_vehiculo_preferente || '',
        req_caracteristicas_especiales: props.asignacion.req_caracteristicas_especiales || '',
        observaciones: props.asignacion.observaciones || '',
        origen_lat: props.asignacion.origen_lat || null,
        origen_lon: props.asignacion.origen_lon || null,
        destino_lat: props.asignacion.destino_lat || null,
        destino_lon: props.asignacion.destino_lon || null,
        fecha_hora_fin_prevista: props.asignacion.fecha_hora_fin_prevista ? props.asignacion.fecha_hora_fin_prevista.slice(0,16) : '',
        fecha_hora_fin_real: props.asignacion.fecha_hora_fin_real ? props.asignacion.fecha_hora_fin_real.slice(0,16) : '',
        estado: props.asignacion.estado || 'pendiente_auto',
        solicitante_jerarquia: typeof props.asignacion.solicitante_jerarquia === 'number' ? props.asignacion.solicitante_jerarquia : 0,
        solicitante_nombre: props.asignacion.solicitante_nombre || '',
        solicitante_telefono: props.asignacion.solicitante_telefono || '',
      } : {})
    };

    this.debouncedBuscarSugerenciasCalle = debounce(this.buscarSugerenciasCalleApi.bind(this), 500);
  }

  tryCalcularRuta = () => {
    const { origen_lat, origen_lon, destino_lat, destino_lon } = this.state;
    if (origen_lat && origen_lon && destino_lat && destino_lon) {
      const url = 'https://router.project-osrm.org/route/v1/driving/' + origen_lon + ',' + origen_lat + ';' + destino_lon + ',' + destino_lat + '?overview=full&geometries=geojson';
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            this.setState({
              ruta: route.geometry,
              distancia: (route.distance / 1000).toFixed(2) + ' km'
            });
          } else {
            this.setState({ ruta: null, distancia: null });
          }
        })
        .catch(() => {
          this.setState({ ruta: null, distancia: null });
        });
    }
  };

  componentDidMount() {
    if (typeof window !== 'undefined' && window.L && !this.map) {
      this.map = window.L.map('map').setView([-33.45, -70.65], 7);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    }
        if (this.origenMarker) {
      this.map.removeLayer(this.origenMarker);
      this.origenMarker = null;
    }
    if (this.destinoMarker) {
      this.map.removeLayer(this.destinoMarker);
      this.destinoMarker = null;
    }
    if (this.state.origen_lat && this.state.origen_lon) {
      this.origenMarker = L.marker([this.state.origen_lat, this.state.origen_lon], { icon: origenIcon })
        .addTo(this.map)
        .bindPopup('Origen');
    }
    if (this.state.destino_lat && this.state.destino_lon) {
      this.destinoMarker = L.marker([this.state.destino_lat, this.state.destino_lon], { icon: destinoIcon })
        .addTo(this.map)
        .bindPopup('Destino');
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.ruta &&
      this.state.ruta !== prevState.ruta &&
      typeof window !== 'undefined' &&
      window.L &&
      this.map
    ) {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
      }
      const geojson = {
        type: "Feature",
        geometry: this.state.ruta
      };
      this.routeLayer = window.L.geoJSON(geojson, {
        style: { color: 'blue', weight: 5 }
      }).addTo(this.map);

      try {
        const coords = this.state.ruta.coordinates.map(coord => [coord[1], coord[0]]);
        if (coords && coords.length > 0) {
          this.map.fitBounds(coords);
        }
      }
      catch (e) {
        console.error("Error procesando coordenadas de ruta para límites de mapa:", e);
      }
    }
    if (
      (!this.state.origen_descripcion && !this.state.destino_descripcion) &&
      (prevState.origen_descripcion || prevState.destino_descripcion)
    ) {
      if (this.routeLayer && this.map) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
        this.setState({ distancia: null, ruta: null });
      }
    }
        if (
      (this.state.origen_lat !== prevState.origen_lat || this.state.origen_lon !== prevState.origen_lon) ||
      (this.state.destino_lat !== prevState.destino_lat || this.state.destino_lon !== prevState.destino_lon)
    ) {
      // Elimina marcadores anteriores si existen
      if (this.origenMarker) {
        this.map.removeLayer(this.origenMarker);
        this.origenMarker = null;
      }
      if (this.destinoMarker) {
        this.map.removeLayer(this.destinoMarker);
        this.destinoMarker = null;
      }
      // Agrega marcadores nuevos si hay coordenadas
      if (this.state.origen_lat && this.state.origen_lon) {
        this.origenMarker = L.marker([this.state.origen_lat, this.state.origen_lon], { icon: origenIcon })
          .addTo(this.map)
          .bindPopup('Origen');
      }
      if (this.state.destino_lat && this.state.destino_lon) {
        this.destinoMarker = L.marker([this.state.destino_lat, this.state.destino_lon], { icon: destinoIcon })
          .addTo(this.map)
          .bindPopup('Destino');
      }
    }
  }

  handleSuggestionClick = (campo, sugerencia) => {
    this.setState({
      [campo + '_descripcion']: sugerencia.display_name,
      [campo + '_lat']: parseFloat(sugerencia.lat),
      [campo + '_lon']: parseFloat(sugerencia.lon),
      [campo + '_calle_sugerencias']: []
    }, this.tryCalcularRuta);
  };

  handleCalleInputChange = (campo, e) => {
    const valor = e.target.value;
    this.setState({
      [campo + '_descripcion']: valor,
      [campo + '_calle_sugerencias']: [],
      error: null
    });
    if (valor.length >= 3) {
      this.debouncedBuscarSugerenciasCalle(campo, valor);
    } else {
      this.setState({ [campo + '_calle_sugerencias']: [] });
    }
  };

  buscarSugerenciasCalleApi = (campo, valorDescripcion) => {
    fetch('https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&addressdetails=1&limit=15&state=Región%20de%20Valparaíso&street=' + encodeURIComponent(valorDescripcion))
      .then(res => {
        if (!res.ok) throw new Error('Error ' + res.status + ' de Nominatim (Descripción)');
        return res.json();
      })
      .then(data => {
        const calles = data.filter(d =>
          (
            ['residential', 'road', 'street', 'tertiary', 'secondary', 'primary', 'footway', 'path', 'cycleway', 'service'].includes(d.type)
          ) &&
          d.address &&
          (d.address.road || d.address.street || d.address.footway || d.address.path || d.address.cycleway || d.address.service) &&
          (
            (d.address.city && d.address.city.toLowerCase().includes('valparaíso')) ||
            (d.address.town && d.address.town.toLowerCase().includes('valparaíso')) ||
            (d.address.village && d.address.village.toLowerCase().includes('valparaíso')) ||
            (d.display_name && d.display_name.toLowerCase().includes('valparaíso'))
          )
        );
        this.setState({ [campo + '_calle_sugerencias']: calles });
      })
      .catch(error => {
        console.error("Error buscando sugerencias de descripción:", error);
        this.setState({ [campo + '_calle_sugerencias']: [], error: 'Error al buscar ubicaciones.' });
      });
  };

  handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;
    if (type === 'number') {
      newValue = value === "" ? "" : parseInt(value, 10);
    }
    this.setState({ [name]: newValue, error: null }, () => {
      if (name === 'req_tipo_vehiculo_preferente') {
        const { vehiculo_id } = this.state;
        const { vehiculosDisponibles } = this.props;
        if (vehiculo_id && vehiculosDisponibles) {
          const vehiculoSeleccionado = vehiculosDisponibles.find(v => v.id === vehiculo_id);
          if (vehiculoSeleccionado && vehiculoSeleccionado.tipo_vehiculo !== this.state.req_tipo_vehiculo_preferente) {
            this.setState({ vehiculo_id: '' });
          }
        }
      }
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitting: true, error: null });

    const {
      vehiculo_id, conductor_id, origen_descripcion, destino_descripcion,
      fecha_hora_requerida_inicio, req_pasajeros, req_tipo_vehiculo_preferente,
      req_caracteristicas_especiales, observaciones, solicitante_jerarquia,
      solicitante_nombre, solicitante_telefono, estado,
      origen_lat, origen_lon, destino_lat, destino_lon,
      fecha_hora_fin_prevista, fecha_hora_fin_real,
    } = this.state;

    const fecha_hora_solicitud = new Date().toISOString();

    if (!origen_descripcion) {
      this.setState({ error: "Debe ingresar la Descripción de Origen.", submitting: false });
      return;
    }
    if (!destino_descripcion || destino_descripcion === 'Destino pendiente') {
      this.setState({ error: "Debe ingresar la Descripción de Destino válida.", submitting: false });
      return;
    }
    if (!fecha_hora_requerida_inicio) {
      this.setState({ error: "La fecha y hora de inicio son requeridas.", submitting: false });
      return;
    }
    if (req_pasajeros < 1) {
      this.setState({ error: "El número de pasajeros debe ser al menos 1.", submitting: false });
      return;
    }

    const asignacionData = {
      vehiculo: vehiculo_id || null,
      conductor: conductor_id || null,
      origen_descripcion,
      destino_descripcion,
      fecha_hora_solicitud,
      fecha_hora_requerida_inicio,
      req_pasajeros,
      req_tipo_vehiculo_preferente: req_tipo_vehiculo_preferente || null,
      req_caracteristicas_especiales: req_caracteristicas_especiales || "",
      observaciones: observaciones || null,
      solicitante_jerarquia,
      solicitante_nombre,
      solicitante_telefono,
      estado,
      origen_lat: origen_lat || null,
      origen_lon: origen_lon || null,
      destino_lat: destino_lat || null,
      destino_lon: destino_lon || null,
      fecha_hora_fin_prevista: fecha_hora_fin_prevista || null,
      fecha_hora_fin_real: fecha_hora_fin_real || null,
    };

    const prom = this.props.asignacion
      ? updateAsignacion(this.props.asignacion.id, asignacionData)
      : createAsignacion(asignacionData);

    prom
      .then(() => {
        this.setState({ ...this.initialState, submitting: false });
        if (this.map && this.routeLayer) {
          this.map.removeLayer(this.routeLayer);
          this.routeLayer = null;
        }
        if (this.props.onAsignacionCreada) {
          this.props.onAsignacionCreada();
        }
      })
      .catch(error => {
        let errores = null;
        if (error && error.response && error.response.data) {
          errores = error.response.data;
        } else if (error && error.message) {
          errores = { general: [error.message] };
        } else {
          errores = { general: ['Error al crear o actualizar la asignación.'] };
        }
        this.setState({ errores, submitting: false });
      });
  };

  render(props, state) {
    const {
      vehiculo_id, conductor_id,
      origen_descripcion, destino_descripcion,
      fecha_hora_requerida_inicio, req_pasajeros,
      req_tipo_vehiculo_preferente, req_caracteristicas_especiales,
      observaciones, solicitante_jerarquia,
      solicitante_nombre, solicitante_telefono, estado,
      error, submitting
    } = state;

    const { vehiculosDisponibles, conductoresDisponibles, userGroup } = props;

    // Detecta si el grupo es funcionario (insensible a mayúsculas y plural)
    const isFuncionario = Array.isArray(userGroup)
      ? userGroup.some(g => g && g.toLowerCase().includes('funcionario'))
      : (userGroup && userGroup.toLowerCase().includes('funcionario'));

    const tipoVehiculoChoices = [
      { value: '', label: 'Cualquiera (opcional)' },
      { value: 'automovil', label: 'Automóvil' },
      { value: 'camioneta', label: 'Camioneta' },
      { value: 'minibus', label: 'Minibús' },
      { value: 'station_wagon', label: 'Station Wagon' },
    ];
    const estadoChoices = [
      { value: 'pendiente_auto', label: 'Pendiente de Asignación Automática' },
      { value: 'programada', label: 'Programada (Auto/Manual)' },
      { value: 'activa', label: 'Activa' },
      { value: 'completada', label: 'Completada' },
      { value: 'cancelada', label: 'Cancelada' },
      { value: 'fallo_auto', label: 'Falló Asignación Automática' },
    ];

    let vehiculosFiltrados = vehiculosDisponibles || [];
    if (req_tipo_vehiculo_preferente) {
      vehiculosFiltrados = vehiculosFiltrados.filter(v => v.tipo_vehiculo === req_tipo_vehiculo_preferente);
    }

    return (
        <div class={formStyle.formContainer}>
          <h2>
            Agregar Asignación
          </h2>
          {error && <p class={formStyle.error}>{error}</p>}
          {state.errores && (
            <div class={formStyle.errorMsg}>
              {Object.entries(state.errores).map(([campo, mensajes]) =>
                mensajes.map(msg => (
                  <div>{campo !== 'general' ? `${campo}: ` : ''}{msg}</div>
                ))
              )}
            </div>
          )}
        <form onSubmit={this.handleSubmit}>

          {/* SOLO PARA NO FUNCIONARIOS */}
          {!isFuncionario && (
            <>
              <div class={formStyle.formGroup}>
                <label htmlFor="req_tipo_vehiculo_preferente">Tipo Vehículo Preferente (opcional):</label>
                <select name="req_tipo_vehiculo_preferente" id="req_tipo_vehiculo_preferente" value={req_tipo_vehiculo_preferente} onInput={this.handleChange}>
                  {tipoVehiculoChoices.map(choice => (
                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                  ))}
                </select>
              </div>

              <div class={formStyle.formGroup}>
                <label htmlFor="vehiculo_id">Vehículo (Opcional):</label>
                <select name="vehiculo_id" id="vehiculo_id" value={vehiculo_id} onInput={this.handleChange}>
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculosFiltrados.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} ({v.patente}) - {v.estado}
                    </option>
                  ))}
                </select>
              </div>

              <div class={formStyle.formGroup}>
                <label htmlFor="conductor_id">Conductor (Opcional):</label>
                <select name="conductor_id" id="conductor_id" value={conductor_id} onInput={this.handleChange}>
                  <option value="">-- Seleccionar Conductor --</option>
                  {conductoresDisponibles && conductoresDisponibles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido} ({c.estado_disponibilidad})
                    </option>
                  ))}
                </select>
              </div>

              <div class={formStyle.formGroup}>
                <label htmlFor="fecha_hora_fin_prevista">Fecha y Hora Fin Prevista (opcional):</label>
                <input type="datetime-local" name="fecha_hora_fin_prevista" id="fecha_hora_fin_prevista"
                  value={state.fecha_hora_fin_prevista || ''} onInput={this.handleChange} />
              </div>

              <div class={formStyle.formGroup}>
                <label htmlFor="fecha_hora_fin_real">Fecha y Hora Fin Real (opcional):</label>
                <input type="datetime-local" name="fecha_hora_fin_real" id="fecha_hora_fin_real"
                  value={state.fecha_hora_fin_real || ''} onInput={this.handleChange} />
              </div>

              <div class={formStyle.formGroup}>
                <label htmlFor="observaciones">Observaciones (opcional):</label>
                <textarea name="observaciones" id="observaciones" value={observaciones} onInput={this.handleChange} />
              </div>

              <div class={formStyle.formGroup}>
                <label htmlFor="estado">Estado:</label>
                <select name="estado" id="estado" value={estado} onInput={this.handleChange}>
                  {estadoChoices.map(choice => (
                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* CAMPOS SIEMPRE VISIBLES */}
          <div style="margin-bottom:1em;">
            <div id="map" style="height: 300px; width: 100%;"></div>
            {state.distancia && <p>Distancia estimada: {state.distancia}</p>}
          </div>

          <fieldset class={formStyle.formGroup}>
            <legend>Origen (Región: Valparaíso)</legend>
            <label htmlFor="origen_descripcion">Descripción:</label>
            <input type="text" name="origen_descripcion" id="origen_descripcion"
              value={origen_descripcion}
              onInput={e => this.handleCalleInputChange('origen', e)}
              autoComplete="off" placeholder="Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc." />
            {this.state.origen_calle_sugerencias && this.state.origen_calle_sugerencias.length > 0 && (
              <ul class={formStyle.suggestionsList}>
                {this.state.origen_calle_sugerencias.map(sug => (
                  <li key={sug.place_id || sug.osm_id} onClick={() => this.handleSuggestionClick('origen', sug)}>
                    {sug.display_name}
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <fieldset class={formStyle.formGroup}>
            <legend>Destino (Región: Valparaíso)</legend>
            <label htmlFor="destino_descripcion">Descripción:</label>
            <input type="text" name="destino_descripcion" id="destino_descripcion"
              value={destino_descripcion}
              onInput={e => this.handleCalleInputChange('destino', e)}
              autoComplete="off" placeholder="Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc." />
            {this.state.destino_calle_sugerencias && this.state.destino_calle_sugerencias.length > 0 && (
              <ul class={formStyle.suggestionsList}>
                {this.state.destino_calle_sugerencias.map(sug => (
                  <li key={sug.place_id || sug.osm_id} onClick={() => this.handleSuggestionClick('destino', sug)}>
                    {sug.display_name}
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div class={formStyle.formGroup}>
            <label htmlFor="fecha_hora_requerida_inicio">Fecha y Hora Requerida Inicio:</label>
            <input type="datetime-local" name="fecha_hora_requerida_inicio" id="fecha_hora_requerida_inicio"
              value={fecha_hora_requerida_inicio} onInput={this.handleChange} required />
          </div>

          <div class={formStyle.formGroup}>
            <label htmlFor="req_pasajeros">Nº Pasajeros:</label>
            <input type="number" name="req_pasajeros" id="req_pasajeros" value={req_pasajeros}
              onInput={this.handleChange} min="1" required />
          </div>

          <div class={formStyle.formGroup}>
            <label htmlFor="req_caracteristicas_especiales">Requerimientos Especiales (opcional):</label>
            <textarea name="req_caracteristicas_especiales" id="req_caracteristicas_especiales"
              value={req_caracteristicas_especiales} onInput={this.handleChange} />
          </div>

          <div class={formStyle.formGroup}>
            <label htmlFor="solicitante_jerarquia">Jerarquía del Solicitante:</label>
            <select name="solicitante_jerarquia" id="solicitante_jerarquia" value={solicitante_jerarquia}
              onInput={this.handleChange}>
              <option value="0">Otro/No especificado</option>
              <option value="1">Funcionario</option>
              <option value="2">Coordinación/Referente</option>
              <option value="3">Jefatura/Subdirección</option>
            </select>
          </div>

          <div class={formStyle.formGroup}>
            <label htmlFor="solicitante_nombre">Nombre del Solicitante:</label>
            <input type="text" name="solicitante_nombre" id="solicitante_nombre" value={solicitante_nombre}
              onInput={this.handleChange} />
          </div>

          <div class={formStyle.formGroup}>
            <label htmlFor="solicitante_telefono">Teléfono del Solicitante:</label>
            <input type="text" name="solicitante_telefono" id="solicitante_telefono" value={solicitante_telefono}
              onInput={this.handleChange} />
          </div>

          <div class={formStyle.formActions}>
            <button type="submit" disabled={submitting} class={formStyle.submitButton}>
              {submitting ? (props.asignacion ? 'Actualizando...' : 'Creando...') : (props.asignacion ? 'Actualizar Asignación' : 'Guardar')}
            </button>
            <button type="button" onClick={props.onCancel} class={formStyle.cancelButton} disabled={submitting}>
              Cancelar
            </button>
          </div>

        </form>
      </div>
    );
  }
}

export default AsignacionForm;