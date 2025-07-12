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
    
    // Campo RUN - solo agregar si tiene valor, para evitar conflicto de unicidad con cadenas vacías
    if (run && run.trim()) {
      formData.append('run', run.trim());
    }
    
    // Campos requeridos
    formData.append('nombre', nombre.trim());
    formData.append('apellido', apellido.trim());
    formData.append('numero_licencia', numeroLicencia.trim());
    formData.append('fecha_vencimiento_licencia', fechaVencimiento);
    formData.append('estado_disponibilidad', estadoDisponibilidad);
    
    // Campos opcionales - solo agregar si tienen valor
    if (telefono && telefono.trim()) {
      formData.append('telefono', telefono.trim());
    }
    if (email && email.trim()) {
      formData.append('email', email.trim());
    }
    if (tiposVehiculo && tiposVehiculo.trim()) {
      formData.append('tipos_vehiculo_habilitados', tiposVehiculo.trim());
    }
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
    <div>
      <div class="card-header">
        <h3 class="card-title">{conductor ? 'Editar Conductor' : 'Nuevo Conductor'}</h3>
      </div>
      
      <form onSubmit={handleSubmit} style="padding: 1.5rem;">
        <div class="form-grid">
          <div class="form-group">
            <label for="run">RUN</label>
            <input 
              id="run"
              type="text" 
              class="form-control"
              value={run} 
              onInput={e => setRun(e.target.value)} 
              placeholder="Ej: 12345678-9" 
            />
          </div>
          
          <div class="form-group">
            <label for="nombre">Nombre</label>
            <input 
              id="nombre"
              type="text" 
              class="form-control"
              value={nombre} 
              onInput={e => setNombre(e.target.value)} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="apellido">Apellido</label>
            <input 
              id="apellido"
              type="text" 
              class="form-control"
              value={apellido} 
              onInput={e => setApellido(e.target.value)} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="numeroLicencia">Número de Licencia</label>
            <input 
              id="numeroLicencia"
              type="text" 
              class="form-control"
              value={numeroLicencia} 
              onInput={e => setNumeroLicencia(e.target.value)} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="fechaVencimiento">Fecha de Vencimiento Licencia</label>
            <input 
              id="fechaVencimiento"
              type="date" 
              class="form-control"
              value={fechaVencimiento} 
              onInput={e => setFechaVencimiento(e.target.value)} 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="telefono">Teléfono</label>
            <input 
              id="telefono"
              type="tel" 
              class="form-control"
              value={telefono} 
              onInput={e => setTelefono(e.target.value)} 
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email"
              type="email" 
              class="form-control"
              value={email} 
              onInput={e => setEmail(e.target.value)} 
            />
          </div>
          
          <div class="form-group">
            <label for="estadoDisponibilidad">Estado de Disponibilidad</label>
            <select 
              id="estadoDisponibilidad"
              class="form-control"
              value={estadoDisponibilidad} 
              onInput={e => setEstadoDisponibilidad(e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="en_ruta">En Ruta</option>
              <option value="dia_libre">Día Libre</option>
              <option value="no_disponible">No Disponible</option>
            </select>
          </div>
          
          <div class="form-group full-width">
            <label for="tiposVehiculo">Tipos de Vehículo Habilitados</label>
            <input 
              id="tiposVehiculo"
              type="text" 
              class="form-control"
              value={tiposVehiculo} 
              onInput={e => setTiposVehiculo(e.target.value)} 
              placeholder="Station Wagon, Automóvil, Minibús, Camioneta, etc" 
            />
          </div>
          
          <div class="form-group full-width">
            <label for="foto">Foto del Conductor</label>
            <input
              id="foto"
              type="file"
              class="form-control"
              accept="image/*"
              onChange={e => setFoto(e.target.files[0])}
            />
          </div>
        </div>
        
        {errores && (
          <div class="alert alert-danger" style="margin-top: 1rem;">
            {Object.entries(errores).map(([campo, mensajes]) =>
              mensajes.map((msg, index) => (
                <div key={`${campo}-${index}`}>{campo !== 'general' ? `${campo}: ` : ''}{msg}</div>
              ))
            )}
          </div>
        )}
        
        <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color); margin-top: 1.5rem;">
          <button 
            type="button" 
            onClick={onCancel} 
            class="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
          >
            {conductor ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConductorForm;