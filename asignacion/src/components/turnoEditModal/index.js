import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import style from './style.css';

const TurnoEditModal = ({ turno, onSave, onCancel }) => {
    const [fechaHora, setFechaHora] = useState('');

    useEffect(() => {
        if (turno && turno.fecha_hora) {
            // Formato para datetime-local: YYYY-MM-DDTHH:mm
            const d = new Date(turno.fecha_hora);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setFechaHora(d.toISOString().slice(0, 16));
        }
    }, [turno]);

    const handleSave = () => {
        onSave(turno.id, { fecha_hora: new Date(fechaHora).toISOString() });
    };

    if (!turno) return null;

    return (
        <div class={style.modalOverlay}>
            <div class={style.modalContent}>
                <h2>Editar Registro de Turno</h2>
                <p>
                    Editando la <strong>{turno.tipo === 'entrada' ? 'entrada' : 'salida'}</strong> del conductor.
                </p>
                <div class={style.formGroup}>
                    <label for="fecha_hora">Fecha y Hora</label>
                    <input
                        id="fecha_hora"
                        type="datetime-local"
                        value={fechaHora}
                        onInput={(e) => setFechaHora(e.target.value)}
                    />
                </div>
                <div class={style.formActions}>
                    <button onClick={handleSave} class={style.saveButton}>Guardar Cambios</button>
                    <button onClick={onCancel} class={style.cancelButton}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default TurnoEditModal;
