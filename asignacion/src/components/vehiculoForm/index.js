import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const VehiculoForm = ({ vehiculo, onSave, onUpdate, onCancel }) => {
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [patente, setPatente] = useState('');
    const [tipo_vehiculo, setTipo] = useState('');
    const [anio, setAnio] = useState('');
    const [capacidadPasajeros, setCapacidadPasajeros] = useState('');
    const [numeroChasis, setNumeroChasis] = useState('');
    const [numero_motor, setMotor] = useState('');
    const [foto, setFotoVehiculo] = useState(null);
    const [estado, setEstado] = useState('');

    useEffect(() => {
        setMarca(vehiculo?.marca || '');
        setModelo(vehiculo?.modelo || '');
        setPatente(vehiculo?.patente || '');
        setTipo(vehiculo?.tipo_vehiculo || '');
        setAnio(vehiculo?.anio || '');
        setCapacidadPasajeros(vehiculo?.capacidad_pasajeros || '');
        setNumeroChasis(vehiculo?.numero_chasis || '');
        setMotor(vehiculo?.numero_motor || '');
        setFotoVehiculo(null);
        setEstado(vehiculo?.estado || '');
    }, [vehiculo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('marca', marca);
        formData.append('modelo', modelo);
        formData.append('patente', patente);
        formData.append('tipo_vehiculo', tipo_vehiculo);
        formData.append('anio', anio ? parseInt(anio, 10) : '');
        formData.append('capacidad_pasajeros', capacidadPasajeros ? parseInt(capacidadPasajeros, 10) : '');
        formData.append('numero_chasis', numeroChasis);
        formData.append('numero_motor', numero_motor);
        formData.append('estado', estado);

        if (foto) {
            formData.append('foto', foto);
        }

        if (vehiculo) {
            onUpdate(vehiculo.id, formData);
        } else {
            onSave(formData);
        }
    };

    // Modal flotante centrado y responsivo
    return (
        <div>
            <div class="card-header">
                <h3 class="card-title">{vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
            </div>
            
            <form onSubmit={handleSubmit} style="padding: 1.5rem;">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="marca">Marca</label>
                        <input 
                            id="marca" 
                            type="text" 
                            class="form-control"
                            value={marca} 
                            onInput={(e) => setMarca(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="modelo">Modelo</label>
                        <input 
                            id="modelo" 
                            type="text" 
                            class="form-control"
                            value={modelo} 
                            onInput={(e) => setModelo(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="patente">Patente</label>
                        <input 
                            id="patente" 
                            type="text" 
                            class="form-control"
                            value={patente} 
                            onInput={(e) => setPatente(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="tipo">Tipo</label>
                        <select 
                            id="tipo" 
                            class="form-control"
                            value={tipo_vehiculo} 
                            onInput={(e) => setTipo(e.target.value)} 
                            required
                        >
                            <option value="">Seleccionar tipo</option>
                            <option value="automovil">Automóvil</option>
                            <option value="camioneta">Camioneta</option>
                            <option value="minibus">Minibús</option>
                            <option value="station_wagon">Station Wagon</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="anio">Año</label>
                        <input 
                            id="anio" 
                            type="number" 
                            class="form-control"
                            placeholder="Ej: 2023" 
                            value={anio} 
                            onInput={(e) => setAnio(e.target.value)} 
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="capacidad">Capacidad de Pasajeros</label>
                        <input 
                            id="capacidad" 
                            type="number" 
                            class="form-control"
                            placeholder="Ej: 5" 
                            value={capacidadPasajeros} 
                            onInput={(e) => setCapacidadPasajeros(e.target.value)} 
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="estado">Estado</label>
                        <select 
                            id="estado" 
                            class="form-control"
                            value={estado} 
                            onInput={(e) => setEstado(e.target.value)} 
                            required
                        >
                            <option value="">Seleccionar estado</option>
                            <option value="disponible">Disponible</option>
                            <option value="en_uso">En Ruta</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="reservado">Reservado</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="numero_chasis">Número de Chasis</label>
                        <input 
                            id="numero_chasis" 
                            type="text" 
                            class="form-control"
                            value={numeroChasis} 
                            onInput={(e) => setNumeroChasis(e.target.value)} 
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="numero_motor">Motor</label>
                        <input 
                            id="numero_motor" 
                            type="text" 
                            class="form-control"
                            value={numero_motor} 
                            onInput={(e) => setMotor(e.target.value)} 
                        />
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="foto">Foto del Vehículo</label>
                        <input 
                            id="foto" 
                            type="file" 
                            class="form-control"
                            accept="image/*"
                            onChange={(e) => setFotoVehiculo(e.target.files[0])} 
                        />
                    </div>
                </div>
                
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
                        {vehiculo ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VehiculoForm;