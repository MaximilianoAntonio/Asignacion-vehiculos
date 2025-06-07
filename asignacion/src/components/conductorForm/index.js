import { h, Component } from 'preact';
import style from './style.css';
import { createConductor, updateConductor } from '../../services/conductorService';

class ConductorForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      conductor: props.conductor || {
        nombre: '',
        apellido: '',
        numero_licencia: '',
        fecha_vencimiento_licencia: '',
        telefono: '',
        email: '',
        activo: true,
        tipos_vehiculo_habilitados: '',
        estado_disponibilidad: 'disponible'
        // ubicacion_actual_lat y ubicacion_actual_lon eliminados
      },
      modoEdicion: !!props.conductor,
      errores: null,
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.conductor !== this.props.conductor) {
      this.setState({
        conductor: this.props.conductor || {
          nombre: '',
          apellido: '',
          numero_licencia: '',
          fecha_vencimiento_licencia: '',
          telefono: '',
          email: '',
          activo: true,
          tipos_vehiculo_habilitados: '',
          estado_disponibilidad: 'disponible'
          // ubicacion_actual_lat y ubicacion_actual_lon eliminados
        },
        modoEdicion: !!this.props.conductor,
        errores: null,
      });
    }
  }

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState(prevState => ({
      conductor: {
        ...prevState.conductor,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (this.state.modoEdicion) {
        await updateConductor(this.state.conductor.id, this.state.conductor);
      } else {
        await createConductor(this.state.conductor);
      }
      this.setState({ errores: null });
      this.props.onConductorGuardado();
    } catch (error) {
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
    const { conductor, modoEdicion, errores } = this.state;
    return (
      <form class={style.formContainer} onSubmit={this.handleSubmit}>
        <button type="button" class={style.closeButton} onClick={this.props.onCancel}>✖</button>
        <h3>{modoEdicion ? 'Editar Conductor' : 'Agregar Nuevo Conductor'}</h3>

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
          <label>Nombre:</label>
          <input type="text" name="nombre" value={conductor.nombre} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Apellido:</label>
          <input type="text" name="apellido" value={conductor.apellido} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Número de Licencia:</label>
          <input type="text" name="numero_licencia" value={conductor.numero_licencia} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Fecha de Vencimiento Licencia:</label>
          <input type="date" name="fecha_vencimiento_licencia" value={conductor.fecha_vencimiento_licencia} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Teléfono:</label>
          <input type="tel" name="telefono" value={conductor.telefono} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Email:</label>
          <input type="email" name="email" value={conductor.email} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Activo:</label>
          <input type="checkbox" name="activo" checked={conductor.activo} onChange={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Tipos de Vehículo Habilitados:</label>
          <input type="text" name="tipos_vehiculo_habilitados" value={conductor.tipos_vehiculo_habilitados} onInput={this.handleChange} placeholder="automovil,camioneta" />
        </div>

        <div class={style.formGroup}>
          <label>Estado de Disponibilidad:</label>
          <select name="estado_disponibilidad" value={conductor.estado_disponibilidad} onInput={this.handleChange}>
            <option value="disponible">Disponible</option>
            <option value="en_ruta">En Ruta</option>
            <option value="dia_libre">Día Libre</option>
            <option value="no_disponible">No Disponible</option>
          </select>
        </div>

        <div class={style.formActions}>
          <button type="submit" class={style.submitButton}>
            {modoEdicion ? 'Guardar Cambios' : 'Agregar Conductor'}
          </button>
          <button type="button" class={style.cancelButton} onClick={this.props.onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }
}

export default ConductorForm;