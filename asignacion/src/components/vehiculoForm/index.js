import { h, Component } from 'preact';
import style from './style.css';
import { createVehiculo, updateVehiculo } from '../../services/vehicleService';

class VehiculoForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vehiculo: props.vehiculo || {
        patente: '',
        marca: '',
        modelo: '',
        anio: '',
        numero_chasis: '',
        numero_motor: '',
        tipo_vehiculo: 'automovil',
        capacidad_pasajeros: 4,
        caracteristicas_adicionales: '',
        estado: 'disponible',
        ubicacion: '',
        conductor_preferente: '',
        foto: null
      },
      modoEdicion: !!props.vehiculo,
      errores: null,
      ubicacion_sugerencias: [],
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.vehiculo !== this.props.vehiculo) {
      this.setState({
        vehiculo: this.props.vehiculo || {
          patente: '',
          marca: '',
          modelo: '',
          anio: '',
          numero_chasis: '',
          numero_motor: '',
          tipo_vehiculo: 'automovil',
          capacidad_pasajeros: 4,
          caracteristicas_adicionales: '',
          estado: 'disponible',
          ubicacion: '',
          conductor_preferente: '',
          foto: null
        },
        modoEdicion: !!this.props.vehiculo
      });
    }
  }

  buscarSugerenciasUbicacion = (valor) => {
    fetch(`/api/nominatim/?q=${encodeURIComponent(valor)}`)
      .then(res => res.json())
      .then(data => {
        console.log('Sugerencias:', data);
        this.setState({ ubicacion_sugerencias: data });
      })
      .catch(() => {
        this.setState({ ubicacion_sugerencias: [] });
      });
  };

  handleUbicacionInput = (e) => {
    const value = e.target.value;
    this.setState(prevState => ({
      vehiculo: {
        ...prevState.vehiculo,
        ubicacion: value
      }
    }));
    if (value.length >= 3) {
      this.buscarSugerenciasUbicacion(value);
    } else {
      this.setState({ ubicacion_sugerencias: [] });
    }
  };

  handleUbicacionSugerenciaClick = (sug) => {
    this.setState(prevState => ({
      vehiculo: {
        ...prevState.vehiculo,
        ubicacion: sug.display_name,
      },
      ubicacion_sugerencias: []
    }));
  };

  handleChange = (e) => {
    const { name, value, type, files } = e.target;
    this.setState(prevState => ({
      vehiculo: {
        ...prevState.vehiculo,
        [name]: type === 'file' ? files[0] : value
      }
    }));
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in this.state.vehiculo) {
      if (this.state.vehiculo[key] !== null) {
        formData.append(key, this.state.vehiculo[key]);
      }
    }

    try {
      if (this.state.modoEdicion) {
        await updateVehiculo(this.state.vehiculo.id, formData);
      } else {
        await createVehiculo(formData);
      }
      this.setState({ errores: null }); // limpia errores si todo sale bien
      this.props.onVehiculoGuardado();
    } catch (error) {
      // Intenta extraer los errores del backend
      let errores = null;
      if (error && error.response && error.response.data) {
        errores = error.response.data;
      } else if (error && error.message) {
        errores = { general: [error.message] };
      } else {
        errores = { general: ['Ocurrió un error inesperado.'] };
      }
      this.setState({ errores });
    }
  }

  render() {
    console.log('ubicacion_sugerencias en render:', this.state.ubicacion_sugerencias);
    const { vehiculo, modoEdicion, errores } = this.state;
    return (
      <form class={style.formContainer} onSubmit={this.handleSubmit}>
        <button type="button" class={style.closeButton} onClick={this.props.onCancel}>✖</button>
        <h3>{modoEdicion ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}</h3>

        {/* Bloque para mostrar errores */}
        {errores && (
          <div class={style.errorMsg}>
            {Object.entries(errores).map(([campo, mensajes]) =>
              mensajes.map(msg => (
                <div>{campo !== 'general' ? `${campo}: ` : ''}{msg}</div>
              ))
            )}
          </div>
        )}

        <div class={style.formGroup}>
          <label>Patente:</label>
          <input type="text" name="patente" value={vehiculo.patente} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Marca:</label>
          <input type="text" name="marca" value={vehiculo.marca} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Modelo:</label>
          <input type="text" name="modelo" value={vehiculo.modelo} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Año:</label>
          <input type="number" name="anio" value={vehiculo.anio} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>N° Chasis:</label>
          <input type="text" name="numero_chasis" value={vehiculo.numero_chasis} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>N° Motor:</label>
          <input type="text" name="numero_motor" value={vehiculo.numero_motor} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Tipo de Vehículo:</label>
          <select name="tipo_vehiculo" value={vehiculo.tipo_vehiculo} onInput={this.handleChange}>
            <option value="automovil">Automóvil</option>
            <option value="camioneta">Camioneta</option>
            <option value="minibus">Minibús</option>
            <option value="station_wagon">Station Wagon</option>
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Capacidad Pasajeros:</label>
          <input type="number" name="capacidad_pasajeros" value={vehiculo.capacidad_pasajeros} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Estado:</label>
          <select name="estado" value={vehiculo.estado} onInput={this.handleChange}>
            <option value="disponible">Disponible</option>
            <option value="en_uso">En Uso</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="reservado">Reservado</option>
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Características Adicionales:</label>
          <textarea name="caracteristicas_adicionales" value={vehiculo.caracteristicas_adicionales} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Ubicación:</label>
          <input
            type="text"
            name="ubicacion"
            value={vehiculo.ubicacion || ''}
            onInput={this.handleUbicacionInput}
            autoComplete="off"
            placeholder="Ej: Avenida Argentina, Pedro Montt, Esmeralda, etc."
          />
          {this.state.ubicacion_sugerencias.length > 0 && (
            <ul class={style.suggestionsList}>
              {this.state.ubicacion_sugerencias.map(sug => (
                <li key={sug.place_id || sug.osm_id} onClick={() => this.handleUbicacionSugerenciaClick(sug)}>
                  {sug.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div class={style.formGroup}>
          <label>Conductor Preferente (ID):</label>
          <input type="text" name="conductor_preferente" value={vehiculo.conductor_preferente} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Foto del vehículo:</label>
          <input type="file" name="foto" accept="image/*" onChange={this.handleChange} />
        </div>

        <div class={style.formActions}>
          <button type="submit" class={style.submitButton}>
            {modoEdicion ? 'Guardar Cambios' : 'Agregar Vehículo'}
          </button>
          <button type="button" class={style.cancelButton} onClick={this.props.onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }
}

export default VehiculoForm;