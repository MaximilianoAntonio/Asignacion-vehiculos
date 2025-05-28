// src/components/conductorForm/index.js
import { h, Component } from 'preact';
import { createConductor, updateConductor } from '../../services/conductorService';
import style from './style.css';

class ConductorForm extends Component {
    state = {
        nombre: '',
        apellido: '',
        numero_licencia: '',
        fecha_vencimiento_licencia: '',
        telefono: '',
        email: '',
        error: null,
        submitting: false,
    };

    componentDidMount() {
        const { conductor } = this.props;
        if (conductor) {
            this.setState({
                nombre: conductor.nombre || '',
                apellido: conductor.apellido || '',
                numero_licencia: conductor.numero_licencia || '',
                fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia?.slice(0, 10) || '',
                telefono: conductor.telefono || '',
                email: conductor.email || '',
            });
        }
    }

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
            fecha_vencimiento_licencia,
            telefono: telefono || null,
            email: email || null,
        };

        const { conductor } = this.props;
        const request = conductor
            ? updateConductor(conductor.id, conductorData)
            : createConductor(conductorData);

        request
            .then(() => {
                if (this.props.onConductorCreado) {
                    this.props.onConductorCreado();
                }
            })
            .catch(error => {
                console.error("Error al guardar el conductor:", error.response);
                let errorMessage = conductor ? 'Error al editar el conductor.' : 'Error al crear el conductor.';
                if (error.response && error.response.data) {
                    const errors = error.response.data;
                    const messages = Object.keys(errors)
                        .map(key => `${key}: ${errors[key].join ? errors[key].join(', ') : errors[key]}`)
                        .join(' ');
                    if (messages) errorMessage += ` Detalles: ${messages}`;
                }
                this.setState({ error: errorMessage });
            })
            .finally(() => {
                this.setState({ submitting: false });
            });
    };

    render(props, { nombre, apellido, numero_licencia, fecha_vencimiento_licencia, telefono, email, error, submitting }) {
        const esEdicion = !!props.conductor;

        return (
            <div class={style.formContainer}>
                <h3>{esEdicion ? 'Editar Conductor' : 'Agregar Nuevo Conductor'}</h3>
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
                        <label for="fecha_vencimiento_licencia">Fecha de Vencimiento de Licencia:</label>
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
                            {submitting
                                ? (esEdicion ? 'Guardando...' : 'Agregando...')
                                : (esEdicion ? 'Guardar Cambios' : 'Agregar Conductor')}
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
