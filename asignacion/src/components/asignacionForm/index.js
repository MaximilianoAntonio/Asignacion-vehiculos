import { h, Component } from 'preact';
import formStyle from '../conductorForm/style.css';
import { createAsignacion, updateAsignacion } from '../../services/asignacionService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
window.L = L;

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
    tipo_servicio: 'funcionarios',
    destino_region: REGION_VALPARAISO,
    destino_ciudad: '',
    destino_calle: '',
    origen_region: REGION_VALPARAISO,
    origen_ciudad: '',
    origen_calle: '',
    fecha_hora_requerida_inicio: '',
    req_pasajeros: 1,
    req_carga_kg: '',
    req_tipo_vehiculo_preferente: '',
    req_caracteristicas_especiales: '',
    observaciones: '',
    origen_calle_sugerencias: [],
    destino_calle_sugerencias: [],
    origen_lat: null,
    origen_lon: null,
    destino_lat: null,
    destino_lon: null,
    distancia: null,
    ruta: null,
    error: null,
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
        tipo_servicio: props.asignacion.tipo_servicio || 'funcionarios',
        origen_region: REGION_VALPARAISO,
        origen_ciudad: '',
        origen_calle: props.asignacion.origen_calle || '',
        destino_region: REGION_VALPARAISO,
        destino_ciudad: '',
        destino_calle: props.asignacion.destino_calle || '',
        fecha_hora_requerida_inicio: props.asignacion.fecha_hora_requerida_inicio?.slice(0, 16) || '',
        req_pasajeros: (typeof props.asignacion.req_pasajeros === 'number') ? props.asignacion.req_pasajeros : this.initialState.req_pasajeros,
        req_carga_kg: (typeof props.asignacion.req_carga_kg === 'number') ? props.asignacion.req_carga_kg : this.initialState.req_carga_kg,
        req_tipo_vehiculo_preferente: props.asignacion.req_tipo_vehiculo_preferente || '',
        req_caracteristicas_especiales: props.asignacion.req_caracteristicas_especiales || '',
        observaciones: props.asignacion.observaciones || ''
      } : {})
    };
    this.debouncedBuscarSugerenciasCalle = debounce(this.buscarSugerenciasCalleApi.bind(this), 500);
  }

  tryCalcularRuta = () => {
    const { origen_lat, origen_lon, destino_lat, destino_lon } = this.state;
    if (origen_lat && origen_lon && destino_lat && destino_lon) {
      // OSRM demo server (solo para pruebas, no para producción)
      const url = `https://router.project-osrm.org/route/v1/driving/${origen_lon},${origen_lat};${destino_lon},${destino_lat}?overview=full&geometries=geojson`;
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
        const coords = this.state.ruta.coordinates.map(([lon, lat]) => [lat, lon]);
        if (coords && coords.length > 0) {
          this.map.fitBounds(coords);
        }
      } catch (e) {
        console.error("Error processing route coordinates for map bounds:", e);
      }
    }
    // Limpiar ruta si se borran direcciones
    if (
      (!this.state.origen_calle && !this.state.destino_calle) &&
      (prevState.origen_calle || prevState.destino_calle)
    ) {
      if (this.routeLayer && this.map) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
        this.setState({ distancia: null, ruta: null });
      }
    }
  }

  handleSuggestionClick = (campo, sugerencia) => {
    this.setState({
      [`${campo}_calle`]: sugerencia.display_name,
      [`${campo}_lat`]: parseFloat(sugerencia.lat),
      [`${campo}_lon`]: parseFloat(sugerencia.lon),
      [`${campo}_calle_sugerencias`]: []
    }, this.tryCalcularRuta); // Llama a calcular ruta después de seleccionar
  };


  handleCalleInputChange = (campo, e) => {
    const valor = e.target.value;
    this.setState({ 
      [`${campo}_calle`]: valor, 
      [`${campo}_calle_sugerencias`]: [],
      error: null // Limpia error al escribir
    });
    if (valor.length >= 3) {
      this.debouncedBuscarSugerenciasCalle(campo, valor);
    } else {
      this.setState({ [`${campo}_calle_sugerencias`]: [] });
    }
  };

  buscarSugerenciasCalleApi = (campo, valorCalle) => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&addressdetails=1&limit=15&state=Región%20de%20Valparaíso&street=${encodeURIComponent(valorCalle)}`)
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status} de Nominatim (Calle)`);
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
        this.setState({ [`${campo}_calle_sugerencias`]: calles });
      })
      .catch(error => {
        console.error("Error buscando sugerencias de calle:", error);
        this.setState({ [`${campo}_calle_sugerencias`]: [], error: 'Error al buscar calles.' });
      });
  };

  handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;
    if (type === 'number') {
      newValue = value === "" ? "" : parseInt(value, 10);
    }
    this.setState({ [name]: newValue, error: null });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitting: true, error: null });

    const {
      vehiculo_id, conductor_id, tipo_servicio,
      origen_calle, origen_lat, origen_lon,
      destino_calle, destino_lat, destino_lon,
      fecha_hora_requerida_inicio, req_pasajeros, req_carga_kg,
      req_tipo_vehiculo_preferente, req_caracteristicas_especiales, observaciones
    } = this.state;

    if (!origen_calle) {
      this.setState({ error: "Debe ingresar la Calle de Origen.", submitting: false });
      return;
    }
    if (!destino_calle) {
      this.setState({ error: "Debe ingresar la Calle de Destino.", submitting: false });
      return;
    }
    if (!origen_lat || !origen_lon || !destino_lat || !destino_lon) {
      this.setState({ error: "Debe seleccionar origen y destino válidos (seleccione una calle de las sugerencias).", submitting: false });
      return;
    }
    if (!fecha_hora_requerida_inicio) {
      this.setState({ error: "La fecha y hora de inicio son requeridas.", submitting: false });
      return;
    }

    const asignacionData = {
      vehiculo: vehiculo_id || null,
      conductor: conductor_id || null,
      tipo_servicio,
      origen_descripcion: `${origen_calle}, Valparaíso`,
      destino_descripcion: `${destino_calle}, Valparaíso`,
      origen_lat,
      origen_lon,
      destino_lat,
      destino_lon,
      fecha_hora_requerida_inicio,
      req_pasajeros,
      req_carga_kg: req_carga_kg === "" ? null : req_carga_kg,
      req_tipo_vehiculo_preferente: req_tipo_vehiculo_preferente || null,
      req_caracteristicas_especiales: req_caracteristicas_especiales || null,
      observaciones: observaciones || null,
      origen_region_raw: REGION_VALPARAISO,
      destino_region_raw: REGION_VALPARAISO,
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
        let errorMessage = this.props.asignacion
          ? 'Error al actualizar la asignación.'
          : 'Error al crear la asignación.';
        if (error.message) {
          errorMessage += ` ${error.message}`;
        }
        this.setState({ error: errorMessage, submitting: false });
      });
  };

  render(props, state) {
    const {
      vehiculo_id, conductor_id, tipo_servicio,
      origen_calle, destino_calle,
      fecha_hora_requerida_inicio, req_pasajeros, req_carga_kg,
      req_tipo_vehiculo_preferente, req_caracteristicas_especiales, observaciones,
      error, submitting
    } = state;

    const { vehiculosDisponibles, conductoresDisponibles } = props;

    const tipoServicioChoices = [
      { value: 'funcionarios', label: 'Traslado de Funcionarios' },
      { value: 'insumos', label: 'Traslado de Insumos' },
      { value: 'pacientes', label: 'Traslado de Pacientes' },
      { value: 'otro', label: 'Otro Servicio' },
    ];
    const tipoVehiculoChoices = [
      { value: '', label: 'Cualquiera (opcional)' },
      { value: 'auto_funcionario', label: 'Auto para Funcionarios' },
      { value: 'furgon_insumos', label: 'Furgón para Insumos' },
      { value: 'ambulancia', label: 'Ambulancia para Pacientes' },
      { value: 'camioneta_grande', label: 'Camioneta Grande Pasajeros' },
      { value: 'camion_carga', label: 'Camión de Carga Ligera' },
      { value: 'otro', label: 'Otro' },
    ];

    const renderSugerencias = (campo) => {
      const sugerencias = this.state[`${campo}_calle_sugerencias`];
      const valor = this.state[`${campo}_calle`];
      if ((!sugerencias || sugerencias.length === 0) && valor && valor.length >= 3 && !this.state[`${campo}_lat`]) {
        return <div class={formStyle.noSuggestions}>No se encontraron calles en Valparaíso con ese nombre.</div>;
      }
      if (!sugerencias || sugerencias.length === 0) return null;

      return (
        <ul class={formStyle.suggestionsList}>
          {sugerencias.map(sug => (
            <li
              key={sug.place_id || sug.osm_id}
              onClick={() => this.handleSuggestionClick(campo, sug)}
            >
              {sug.display_name}
            </li>
          ))}
        </ul>
      );
    };

    return (
      <div class={formStyle.formContainer}>
        <h3>{props.asignacion ? 'Editar Asignación' : 'Crear Nueva Asignación'}</h3>
        {error && <p class={formStyle.error}>{error}</p>}
        <form onSubmit={this.handleSubmit}>
          <div class={formStyle.formGroup}>
            <label htmlFor="tipo_servicio">Tipo de Servicio:</label>
            <select name="tipo_servicio" id="tipo_servicio" value={tipo_servicio} onInput={this.handleChange}>
              {tipoServicioChoices.map(choice => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              ))}
            </select>
          </div>
          {/* Origen */}
          <fieldset class={formStyle.formGroup}>
            <legend>Origen (Región: Valparaíso)</legend>
            <label htmlFor="origen_calle">Calle:</label>
            <input
              type="text"
              name="origen_calle"
              id="origen_calle"
              value={origen_calle}
              onInput={e => this.handleCalleInputChange('origen', e)}
              autoComplete="off"
              placeholder='Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc.'
            />
            {renderSugerencias('origen')}
          </fieldset>
          {/* Destino */}
          <fieldset class={formStyle.formGroup}>
            <legend>Destino (Región: Valparaíso)</legend>
            <label htmlFor="destino_calle">Calle:</label>
            <input
              type="text"
              name="destino_calle"
              id="destino_calle"
              value={destino_calle}
              onInput={e => this.handleCalleInputChange('destino', e)}
              autoComplete="off"
              placeholder='Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc.'
            />
            {renderSugerencias('destino')}
          </fieldset>
          <div style="margin-bottom:1em;">
            <div id="map" style="height: 300px; width: 100%;"></div>
            {state.distancia && <p>Distancia estimada: {state.distancia}</p>}
          </div>
          <div class={formStyle.formGroup}>
            <label htmlFor="fecha_hora_requerida_inicio">Fecha y Hora Requerida Inicio:</label>
            <input type="datetime-local" name="fecha_hora_requerida_inicio" id="fecha_hora_requerida_inicio" value={fecha_hora_requerida_inicio} onInput={this.handleChange} required />
          </div>
          <div class={formStyle.formGroup}>
            <label htmlFor="req_pasajeros">Nº Pasajeros:</label>
            <input type="number" name="req_pasajeros" id="req_pasajeros" value={req_pasajeros} onInput={this.handleChange} min="0" required />
          </div>
          <div class={formStyle.formGroup}>
            <label htmlFor="vehiculo_id">Vehículo (Opcional):</label>
            <select name="vehiculo_id" id="vehiculo_id" value={vehiculo_id} onInput={this.handleChange}>
              <option value="">-- Seleccionar Vehículo --</option>
              {vehiculosDisponibles && vehiculosDisponibles.map(v => (
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
            <label htmlFor="req_carga_kg">Carga Estimada (kg, opcional):</label>
            <input type="number" name="req_carga_kg" id="req_carga_kg" value={req_carga_kg} onInput={this.handleChange} min="0" />
          </div>
          <div class={formStyle.formGroup}>
            <label htmlFor="req_tipo_vehiculo_preferente">Tipo Vehículo Preferente (opcional):</label>
            <select name="req_tipo_vehiculo_preferente" id="req_tipo_vehiculo_preferente" value={req_tipo_vehiculo_preferente} onInput={this.handleChange}>
              {tipoVehiculoChoices.map(choice => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              ))}
            </select>
          </div>
          <div class={formStyle.formGroup}>
            <label htmlFor="req_caracteristicas_especiales">Requerimientos Especiales (opcional):</label>
            <textarea name="req_caracteristicas_especiales" id="req_caracteristicas_especiales" value={req_caracteristicas_especiales} onInput={this.handleChange} />
          </div>
          <div class={formStyle.formGroup}>
            <label htmlFor="observaciones">Observaciones (opcional):</label>
            <textarea name="observaciones" id="observaciones" value={observaciones} onInput={this.handleChange} />
          </div>
          <div class={formStyle.formActions}>
            <button type="submit" disabled={submitting} class={formStyle.submitButton}>
              {submitting ? (props.asignacion ? 'Actualizando...' : 'Creando...') : (props.asignacion ? 'Actualizar Asignación' : 'Crear Asignación')}
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