// src/components/conductorForm/index.js
import { h, Component } from 'preact';
import { createConductor } from '../../services/conductorService';
import style from './style.css'; // Crearemos este archivo

class ConductorForm extends Component {
    state = {
        nombre: '',
        apellido: '',
        numero_licencia: '',
        fecha_vencimiento_licencia: '',
        telefono: '',
        email: '',
        // No incluimos 'activo' y 'tipos_vehiculo_habilitados' para simplificar el formulario inicial
        error: null,
        submitting: false,
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({ submitting: true, error: null });

        const { nombre, apellido, numero_licencia, fecha_vencimiento_licencia, telefono, email } = this.state;
        const conductorData = {
            nombre,
            apellido,
            numero_licencia,
            fecha_vencimiento_licencia, // Asegúrate que el formato de fecha sea YYYY-MM-DD
            telefono: telefono || null, // Envía null si está vacío
            email: email || null,       // Envía null si está vacío
        };

        createConductor(conductorData)
            .then(() => {
                this.setState({
                    nombre: '',
                    apellido: '',
                    numero_licencia: '',
                    fecha_vencimiento_licencia: '',
                    telefono: '',
                    email: '',
                    submitting: false,
                });
                if (this.props.onConductorCreado) {
                    this.props.onConductorCreado();
                }
            })
            .catch(error => {
                console.error("Error creating conductor:", error.response);
                let errorMessage = 'Error al crear el conductor.';
                if (error.response && error.response.data) {
                    // Intenta obtener mensajes de error específicos del backend
                    const errors = error.response.data;
                    const messages = Object.keys(errors)
                        .map(key => `${key}: ${errors[key].join ? errors[key].join(', ') : errors[key]}`)
                        .join(' ');
                    if (messages) errorMessage += ` Detalles: ${messages}`;
                }
                this.setState({ error: errorMessage, submitting: false });
            });
    };

    render(props, { nombre, apellido, numero_licencia, fecha_vencimiento_licencia, telefono, email, error, submitting }) {
        return (
            <div class={style.formContainer}>
                <h3>Agregar Nuevo Conductor</h3>
                {error && <p class={style.error}>{error}</p>}
                <form onSubmit={this.handleSubmit}>
                    <div class={style.formGroup}>
                        <label for="nombre">Nombre:</label>
                        <input type="text" name="nombre" id="nombre" value={nombre} onInput={this.handleChange} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="apellido">Apellido:</label>
                        <input type="text" name="apellido" id="apellido" value={apellido} onInput={this.handleChange} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="numero_licencia">Número de Licencia:</label>
                        <input type="text" name="numero_licencia" id="numero_licencia" value={numero_licencia} onInput={this.handleChange} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="fecha_vencimiento_licencia">Fecha Vencimiento Licencia:</label>
                        <input type="date" name="fecha_vencimiento_licencia" id="fecha_vencimiento_licencia" value={fecha_vencimiento_licencia} onInput={this.handleChange} required />
                    </div>
                     <div class={style.formGroup}>
                        <label for="telefono">Teléfono (opcional):</label>
                        <input type="tel" name="telefono" id="telefono" value={telefono} onInput={this.handleChange} />
                    </div>
                    <div class={style.formGroup}>
                        <label for="email">Email (opcional):</label>
                        <input type="email" name="email" id="email" value={email} onInput={this.handleChange} />
                    </div>
                    <div class={style.formActions}>
                        <button type="submit" disabled={submitting} class={style.submitButton}>
                            {submitting ? 'Agregando...' : 'Agregar Conductor'}
                        </button>
                        <button type="button" onClick={props.onCancel} class={style.cancelButton} disabled={submitting}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default ConductorForm;