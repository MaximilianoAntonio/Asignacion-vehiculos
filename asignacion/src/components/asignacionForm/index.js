import { h, Component } from 'preact';
import style from './style.css';
import { createAsignacion, updateAsignacion } from '../../services/asignacionService';

class AsignacionForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      asignacion: props.asignacion || {
        vehiculo: '',
        conductor: '',
        destino_descripcion: 'Destino pendiente',
        origen_descripcion: '',
        fecha_hora_requerida_inicio: '',
        req_pasajeros: 1,
        req_tipo_vehiculo_preferente: '',
        req_caracteristicas_especiales: '',
        origen_lat: '',
        origen_lon: '',
        destino_lat: '',
        destino_lon: '',
        fecha_hora_fin_prevista: '',
        fecha_hora_fin_real: '',
        estado: 'pendiente_auto',
        observaciones: '',
        solicitante_jerarquia: 0,
        solicitante_nombre: '',
        solicitante_telefono: ''
      },
      modoEdicion: !!props.asignacion,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.asignacion !== this.props.asignacion) {
      this.setState({
        asignacion: this.props.asignacion || this.state.asignacion,
        modoEdicion: !!this.props.asignacion
      });
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      asignacion: {
        ...prevState.asignacion,
        [name]: value
      }
    }));
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (this.state.modoEdicion) {
        await updateAsignacion(this.state.asignacion.id, this.state.asignacion);
      } else {
        await createAsignacion(this.state.asignacion);
      }
      this.props.onAsignacionCreada();
    } catch (error) {
      console.error('Error guardando asignación:', error);
    }
  }

  render() {
    const { asignacion, modoEdicion } = this.state;
    const { vehiculosDisponibles = [], conductoresDisponibles = [] } = this.props;

    return (
      <form class={style.formContainer} onSubmit={this.handleSubmit}>
        <h3>{modoEdicion ? 'Editar Asignación' : 'Nueva Asignación'}</h3>

        <div class={style.formGroup}>
          <label>Vehículo:</label>
          <select name="vehiculo" value={asignacion.vehiculo} onInput={this.handleChange}>
            <option value="">-- Seleccione --</option>
            {vehiculosDisponibles.map(v => (
              <option value={v.id}>{v.patente} - {v.marca}</option>
            ))}
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Conductor:</label>
          <select name="conductor" value={asignacion.conductor} onInput={this.handleChange}>
            <option value="">-- Seleccione --</option>
            {conductoresDisponibles.map(c => (
              <option value={c.id}>{c.nombre} {c.apellido}</option>
            ))}
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Origen:</label>
          <input type="text" name="origen_descripcion" value={asignacion.origen_descripcion} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Destino:</label>
          <input type="text" name="destino_descripcion" value={asignacion.destino_descripcion} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Fecha y hora requerida de inicio:</label>
          <input type="datetime-local" name="fecha_hora_requerida_inicio" value={asignacion.fecha_hora_requerida_inicio} onInput={this.handleChange} required />
        </div>

        <div class={style.formGroup}>
          <label>Pasajeros requeridos:</label>
          <input type="number" name="req_pasajeros" value={asignacion.req_pasajeros} onInput={this.handleChange} min="1" />
        </div>

        <div class={style.formGroup}>
          <label>Tipo de vehículo preferente:</label>
          <select name="req_tipo_vehiculo_preferente" value={asignacion.req_tipo_vehiculo_preferente} onInput={this.handleChange}>
            <option value="">-- Cualquiera --</option>
            <option value="automovil">Automóvil</option>
            <option value="camioneta">Camioneta</option>
            <option value="minibus">Minibús</option>
            <option value="station_wagon">Station Wagon</option>
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Características especiales:</label>
          <textarea name="req_caracteristicas_especiales" value={asignacion.req_caracteristicas_especiales} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Coordenadas origen (lat/lon):</label>
          <input type="number" name="origen_lat" value={asignacion.origen_lat} onInput={this.handleChange} placeholder="Latitud" step="any" />
          <input type="number" name="origen_lon" value={asignacion.origen_lon} onInput={this.handleChange} placeholder="Longitud" step="any" />
        </div>

        <div class={style.formGroup}>
          <label>Coordenadas destino (lat/lon):</label>
          <input type="number" name="destino_lat" value={asignacion.destino_lat} onInput={this.handleChange} placeholder="Latitud" step="any" />
          <input type="number" name="destino_lon" value={asignacion.destino_lon} onInput={this.handleChange} placeholder="Longitud" step="any" />
        </div>

        <div class={style.formGroup}>
          <label>Fecha fin prevista:</label>
          <input type="datetime-local" name="fecha_hora_fin_prevista" value={asignacion.fecha_hora_fin_prevista} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Fecha fin real:</label>
          <input type="datetime-local" name="fecha_hora_fin_real" value={asignacion.fecha_hora_fin_real} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Estado:</label>
          <select name="estado" value={asignacion.estado} onInput={this.handleChange}>
            <option value="pendiente_auto">Pendiente de Asignación Automática</option>
            <option value="programada">Programada (Auto/Manual)</option>
            <option value="activa">Activa</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
            <option value="fallo_auto">Falló Asignación Automática</option>
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Observaciones:</label>
          <textarea name="observaciones" value={asignacion.observaciones} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Jerarquía solicitante:</label>
          <select name="solicitante_jerarquia" value={asignacion.solicitante_jerarquia} onInput={this.handleChange}>
            <option value="3">Jefatura/Subdirección</option>
            <option value="2">Coordinación/Referente</option>
            <option value="1">Funcionario</option>
            <option value="0">Otro/No especificado</option>
          </select>
        </div>

        <div class={style.formGroup}>
          <label>Nombre solicitante:</label>
          <input type="text" name="solicitante_nombre" value={asignacion.solicitante_nombre} onInput={this.handleChange} />
        </div>

        <div class={style.formGroup}>
          <label>Teléfono solicitante:</label>
          <input type="text" name="solicitante_telefono" value={asignacion.solicitante_telefono} onInput={this.handleChange} />
        </div>

        <div class={style.formActions}>
          <button type="submit" class={style.submitButton}>
            {modoEdicion ? 'Guardar Cambios' : 'Crear Asignación'}
          </button>
          <button type="button" class={style.cancelButton} onClick={this.props.onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }
}

export default AsignacionForm;
