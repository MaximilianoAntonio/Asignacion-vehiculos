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
        ubicacion_actual_lat: '',
        ubicacion_actual_lon: '',
        conductor_preferente: '',
        foto: null
      },
      modoEdicion: !!props.vehiculo,
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
          ubicacion_actual_lat: '',
          ubicacion_actual_lon: '',
          conductor_preferente: '',
          foto: null
        },
        modoEdicion: !!this.props.vehiculo
      });
    }
  }

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
      this.props.onVehiculoGuardado();
    } catch (error) {
      console.error('Error guardando vehículo:', error);
    }
  }

  render() {
    const { vehiculo, modoEdicion } = this.state;
    return (
      <form class={style.formContainer} onSubmit={this.handleSubmit}>
        <button type="button" class={style.closeButton} onClick={this.props.onCancel}>✖</button>
        <h3>{modoEdicion ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}</h3>

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
          <label>Latitud Actual:</label>
          <input type="number" name="ubicacion_actual_lat" value={vehiculo.ubicacion_actual_lat} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Longitud Actual:</label>
          <input type="number" name="ubicacion_actual_lon" value={vehiculo.ubicacion_actual_lon} onInput={this.handleChange} />
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