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
        <div class="modal-overlay">
            <div class="modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} class={style.form} style={{ width: '100%' }}>
                    <div class={style.formGroup}>
                        <label for="marca">Marca</label>
                        <input id="marca" type="text" value={marca} onInput={(e) => setMarca(e.target.value)} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="modelo">Modelo</label>
                        <input id="modelo" type="text" value={modelo} onInput={(e) => setModelo(e.target.value)} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="patente">Patente</label>
                        <input id="patente" type="text" value={patente} onInput={(e) => setPatente(e.target.value)} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="tipo">Tipo</label>
                        <select id="tipo" value={tipo_vehiculo} onInput={(e) => setTipo(e.target.value)} required>
                            <option value="automovil">Automóvil</option>
                            <option value="camioneta">Camioneta</option>
                            <option value="minibus">Minibús</option>
                            <option value="station_wagon">Station Wagon</option>
                        </select>
                    </div>
                    <div class={style.formGroup}>
                        <label for="anio">Año</label>
                        <input id="anio" type="number" placeholder="Ej: 2023" value={anio} onInput={(e) => setAnio(e.target.value)} />
                    </div>
                    <div class={style.formGroup}>
                        <label for="capacidad">Capacidad de Pasajeros</label>
                        <input id="capacidad" type="number" placeholder="Ej: 5" value={capacidadPasajeros} onInput={(e) => setCapacidadPasajeros(e.target.value)} />
                    </div>
                    <div class={style.formGroup}>
                        <label for="estado">Estado</label>
                        <select id="estado" value={estado} onInput={(e) => setEstado(e.target.value)} required>
                            <option value="disponible">Disponible</option>
                            <option value="en_uso">En Ruta</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="reservado">Reservado</option>
                        </select>
                    </div>
                    <div class={style.formGroup}>
                        <label for="numero_chasis">Número de Chasis</label>
                        <input id="numero_chasis" type="text" value={numeroChasis} onInput={(e) => setNumeroChasis(e.target.value)} />
                    </div>
                    <div class={style.formGroup}>
                        <label for="numero_motor">Motor</label>
                        <input id="numero_motor" type="text" value={numero_motor} onInput={(e) => setMotor(e.target.value)} />
                    </div>
                    <div class={style.formGroup}>
                        <label for="foto">Foto del Vehículo</label>
                        <input id="foto" type="file" onChange={(e) => setFotoVehiculo(e.target.files[0])} />
                    </div>
                    <div class={style.formActions}>
                        <button type="submit" class={`${style.button} ${style.saveButton}`}>
                            {vehiculo ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button type="button" onClick={onCancel} class={`${style.button} ${style.cancelButton}`}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehiculoForm;