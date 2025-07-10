import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const ConductorForm = ({ conductor, onSave, onUpdate, onCancel }) => {
  const [run, setRun] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tiposVehiculo, setTiposVehiculo] = useState('');
  const [estadoDisponibilidad, setEstadoDisponibilidad] = useState('disponible');
  const [errores, setErrores] = useState(null);
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    setRun(conductor?.run || '');
    setNombre(conductor?.nombre || '');
    setApellido(conductor?.apellido || '');
    setNumeroLicencia(conductor?.numero_licencia || '');
    setFechaVencimiento(conductor?.fecha_vencimiento_licencia || '');
    setTelefono(conductor?.telefono || '');
    setEmail(conductor?.email || '');
    setTiposVehiculo(conductor?.tipos_vehiculo_habilitados || '');
    setEstadoDisponibilidad(conductor?.estado_disponibilidad || 'disponible');
    setErrores(null);
    setFoto(null);
  }, [conductor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('run', run);
    formData.append('nombre', nombre);
    formData.append('apellido', apellido);
    formData.append('numero_licencia', numeroLicencia);
    formData.append('fecha_vencimiento_licencia', fechaVencimiento);
    formData.append('telefono', telefono);
    formData.append('email', email);
    formData.append('tipos_vehiculo_habilitados', tiposVehiculo);
    formData.append('estado_disponibilidad', estadoDisponibilidad);
    if (foto) {
      formData.append('foto', foto);
    }
    try {
      if (conductor) {
        await onUpdate(conductor.id, formData);
      } else {
        await onSave(formData);
      }
      setErrores(null);
    } catch (error) {
      let err = null;
      if (error && error.response && error.response.data) {
        err = error.response.data;
      } else if (error && error.message) {
        err = { general: [error.message] };
      } else {
        err = { general: ['Ocurrió un error inesperado.'] };
      }
      setErrores(err);
    }
  };

  // Modal flotante centrado y responsivo
  return (
    <div class={style['modal-overlay']} onClick={onCancel}>
      <div class={style['modal-content']} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} class={style.formContainer} style={{ width: '100%' }}>
          <h3>{conductor ? 'Editar Conductor' : 'Nuevo Conductor'}</h3>
          <div class={style.formGroup}>
            <label>RUN</label>
            <input type="text" value={run} onInput={e => setRun(e.target.value)} placeholder="Ej: 12345678-9" />
          </div>
          <div class={style.formGroup}>
            <label>Nombre</label>
            <input type="text" value={nombre} onInput={e => setNombre(e.target.value)} required />
          </div>
          <div class={style.formGroup}>
            <label>Apellido</label>
            <input type="text" value={apellido} onInput={e => setApellido(e.target.value)} required />
          </div>
          <div class={style.formGroup}>
            <label>Número de Licencia</label>
            <input type="text" value={numeroLicencia} onInput={e => setNumeroLicencia(e.target.value)} required />
          </div>
          <div class={style.formGroup}>
            <label>Fecha de Vencimiento Licencia</label>
            <input type="date" value={fechaVencimiento} onInput={e => setFechaVencimiento(e.target.value)} required />
          </div>
          <div class={style.formGroup}>
            <label>Teléfono</label>
            <input type="tel" value={telefono} onInput={e => setTelefono(e.target.value)} />
          </div>
          <div class={style.formGroup}>
            <label>Email</label>
            <input type="email" value={email} onInput={e => setEmail(e.target.value)} />
          </div>
          <div class={style.formGroup}>
            <label>Tipos de Vehículo Habilitados</label>
            <input type="text" value={tiposVehiculo} onInput={e => setTiposVehiculo(e.target.value)} placeholder="Station Wagon, Automóvil, Minibús, Camioneta, etc" />
          </div>
          <div class={style.formGroup}>
            <label>Estado de Disponibilidad</label>
            <select value={estadoDisponibilidad} onInput={e => setEstadoDisponibilidad(e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="en_ruta">En Ruta</option>
              <option value="dia_libre">Día Libre</option>
              <option value="no_disponible">No Disponible</option>
            </select>
          </div>
          <div class={style.formGroup}>
            <label for="foto">Foto del Conductor</label>
            <input
              id="foto"
              type="file"
              accept="image/*"
              onChange={e => setFoto(e.target.files[0])}
            />
          </div>
          {errores && (
            <div class={style.errorMsg}>
              {Object.entries(errores).map(([campo, mensajes]) =>
                mensajes.map(msg => (
                  <div>{campo !== 'general' ? `${campo}: ` : ''}{msg}</div>
                ))
              )}
            </div>
          )}
          <div class={style.formActions}>
            <button type="submit" class={style.submitButton}>
              {conductor ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" onClick={onCancel} class={style.cancelButton}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConductorForm;