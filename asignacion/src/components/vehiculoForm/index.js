import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const VehiculoForm = ({ vehiculo, onSave, onUpdate, onCancel }) => {
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [patente, setPatente] = useState('');
    const [tipo, setTipo] = useState('Automóvil');
    const [anio, setAnio] = useState('');
    const [capacidadPasajeros, setCapacidadPasajeros] = useState('');
    const [numeroChasis, setNumeroChasis] = useState('');
    const [motor, setMotor] = useState('');
    const [fotoVehiculo, setFotoVehiculo] = useState(null);

    useEffect(() => {
        setMarca(vehiculo?.marca || '');
        setModelo(vehiculo?.modelo || '');
        setPatente(vehiculo?.patente || '');
        setTipo(vehiculo?.tipo || 'Automóvil');
        setAnio(vehiculo?.anio || '');
        setCapacidadPasajeros(vehiculo?.capacidad_pasajeros || '');
        setNumeroChasis(vehiculo?.numero_chasis || '');
        setMotor(vehiculo?.motor || '');
        setFotoVehiculo(null);
    }, [vehiculo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('marca', marca);
        formData.append('modelo', modelo);
        formData.append('patente', patente);
        formData.append('tipo', tipo);
        formData.append('anio', anio);
        formData.append('capacidad_pasajeros', capacidadPasajeros);
        formData.append('numero_chasis', numeroChasis);
        formData.append('motor', motor);

        if (fotoVehiculo) {
            formData.append('foto_vehiculo', fotoVehiculo);
        }

        if (vehiculo) {
            onUpdate(vehiculo.id, formData);
        } else {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} class={style.form}>
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
                <select id="tipo" value={tipo} onInput={(e) => setTipo(e.target.value)} required>
                    <option value="Automóvil">Automóvil</option>
                    <option value="Camioneta">Camioneta</option>
                    <option value="Minibús">Minibús</option>
                    <option value="Station Wagon">Station Wagon</option>
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
                <label for="numero_chasis">Número de Chasis</label>
                <input id="numero_chasis" type="text" value={numeroChasis} onInput={(e) => setNumeroChasis(e.target.value)} />
            </div>
            <div class={style.formGroup}>
                <label for="motor">Motor</label>
                <input id="motor" type="text" value={motor} onInput={(e) => setMotor(e.target.value)} />
            </div>
            <div class={style.formGroup}>
                <label for="foto_vehiculo">Foto del Vehículo</label>
                <input id="foto_vehiculo" type="file" onChange={(e) => setFotoVehiculo(e.target.files[0])} />
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
    );
};

export default VehiculoForm;