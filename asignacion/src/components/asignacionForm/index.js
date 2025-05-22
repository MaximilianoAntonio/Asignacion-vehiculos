// src/components/asignacionForm/index.js
import { h, Component } from 'preact';
import { createAsignacion } from '../../services/asignacionService';
// Reutiliza los estilos de conductorForm o crea uno nuevo si es muy diferente
import formStyle from '../conductorForm/style.css'; // Ojo: Reutilizando!

class AsignacionForm extends Component {
    // El estado inicial debe reflejar los campos del modelo Asignacion
    // que quieres permitir crear desde el formulario.
    initialState = {
        vehiculo_id: '', // Se enviará como vehiculo al serializer
        conductor_id: '', // Se enviará como conductor
        tipo_servicio: 'funcionarios',
        destino_descripcion: '',
        origen_descripcion: '',
        fecha_hora_requerida_inicio: '', // Formato YYYY-MM-DDTHH:MM
        req_pasajeros: 1,
        req_carga_kg: '',
        req_tipo_vehiculo_preferente: '',
        req_caracteristicas_especiales: '',
        observaciones: '',
        // No incluimos todos los campos para simplificar, añade según necesidad
        error: null,
        submitting: false,
    };

    state = { ...this.initialState };

    handleChange = (e) => {
        const { name, value, type } = e.target;
        this.setState({ [name]: type === 'number' ? parseInt(value, 10) : value });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({ submitting: true, error: null });

        const {
            vehiculo_id, conductor_id, tipo_servicio, destino_descripcion, origen_descripcion,
            fecha_hora_requerida_inicio, req_pasajeros, req_carga_kg,
            req_tipo_vehiculo_preferente, req_caracteristicas_especiales, observaciones
        } = this.state;

        const asignacionData = {
            vehiculo: vehiculo_id || null, // DRF espera 'vehiculo' no 'vehiculo_id' para PrimaryKeyRelatedField
            conductor: conductor_id || null,
            tipo_servicio,
            destino_descripcion,
            origen_descripcion: origen_descripcion || null,
            fecha_hora_requerida_inicio,
            req_pasajeros,
            req_carga_kg: req_carga_kg || null,
            req_tipo_vehiculo_preferente: req_tipo_vehiculo_preferente || null,
            req_caracteristicas_especiales: req_caracteristicas_especiales || null,
            observaciones: observaciones || null,
            // estado por defecto es 'pendiente_auto' en el backend
        };

        createAsignacion(asignacionData)
            .then(() => {
                this.setState({ ...this.initialState, submitting: false }); // Reset form
                if (this.props.onAsignacionCreada) {
                    this.props.onAsignacionCreada();
                }
            })
            .catch(error => {
                console.error("Error creating asignacion:", error.response);
                let errorMessage = 'Error al crear la asignación.';
                if (error.response && error.response.data) {
                    const errors = error.response.data;
                    const messages = Object.keys(errors)
                        .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]}`)
                        .join('; ');
                    if (messages) errorMessage += ` Detalles: ${messages}`;
                }
                this.setState({ error: errorMessage, submitting: false });
            });
    };

    render(props, state) {
        const {
            vehiculo_id, conductor_id, tipo_servicio, destino_descripcion, origen_descripcion,
            fecha_hora_requerida_inicio, req_pasajeros, req_carga_kg,
            req_tipo_vehiculo_preferente, req_caracteristicas_especiales, observaciones,
            error, submitting
        } = state;

        const { vehiculosDisponibles, conductoresDisponibles } = props;

        const tipoServicioChoices = [
            { value: 'funcionarios', label: 'Traslado de Funcionarios' },
            { value: 'insumos', label: 'Traslado de Insumos' },
            { value: 'pacientes', label: 'Traslado de Pacientes' },
            { value: 'otro', label: 'Otro Servicio' },
        ];
        // Deberías obtener TIPO_VEHICULO_CHOICES de una fuente común o del backend
        const tipoVehiculoChoices = [
            { value: '', label: 'Cualquiera (opcional)'},
            { value: 'auto_funcionario', label: 'Auto para Funcionarios' },
            { value: 'furgon_insumos', label: 'Furgón para Insumos' },
            { value: 'ambulancia', label: 'Ambulancia para Pacientes' },
            { value: 'camioneta_grande', label: 'Camioneta Grande Pasajeros' },
            { value: 'camion_carga', label: 'Camión de Carga Ligera' },
            { value: 'otro', label: 'Otro' },
        ];


        return (
            <div class={formStyle.formContainer}>
                <h3>Crear Nueva Asignación</h3>
                {error && <p class={formStyle.error}>{error}</p>}
                <form onSubmit={this.handleSubmit}>
                    <div class={formStyle.formGroup}>
                        <label for="tipo_servicio">Tipo de Servicio:</label>
                        <select name="tipo_servicio" id="tipo_servicio" value={tipo_servicio} onChange={this.handleChange}>
                            {tipoServicioChoices.map(choice => (
                                <option key={choice.value} value={choice.value}>{choice.label}</option>
                            ))}
                        </select>
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="destino_descripcion">Destino (Descripción):</label>
                        <input type="text" name="destino_descripcion" id="destino_descripcion" value={destino_descripcion} onInput={this.handleChange} required />
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="fecha_hora_requerida_inicio">Fecha y Hora Requerida Inicio:</label>
                        <input type="datetime-local" name="fecha_hora_requerida_inicio" id="fecha_hora_requerida_inicio" value={fecha_hora_requerida_inicio} onInput={this.handleChange} required />
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="req_pasajeros">Nº Pasajeros:</label>
                        <input type="number" name="req_pasajeros" id="req_pasajeros" value={req_pasajeros} onInput={this.handleChange} min="0" required />
                    </div>

                    {/* Selects para Vehículo y Conductor (opcionales para asignación automática) */}
                    <div class={formStyle.formGroup}>
                        <label for="vehiculo_id">Vehículo (Opcional):</label>
                        <select name="vehiculo_id" id="vehiculo_id" value={vehiculo_id} onChange={this.handleChange}>
                            <option value="">-- Seleccionar Vehículo --</option>
                            {vehiculosDisponibles && vehiculosDisponibles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.marca} {v.modelo} ({v.patente}) - {v.estado}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="conductor_id">Conductor (Opcional):</label>
                        <select name="conductor_id" id="conductor_id" value={conductor_id} onChange={this.handleChange}>
                            <option value="">-- Seleccionar Conductor --</option>
                            {conductoresDisponibles && conductoresDisponibles.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre} {c.apellido} ({c.estado_disponibilidad})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="origen_descripcion">Origen (Descripción, opcional):</label>
                        <input type="text" name="origen_descripcion" id="origen_descripcion" value={origen_descripcion} onInput={this.handleChange} />
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="req_carga_kg">Carga Estimada (kg, opcional):</label>
                        <input type="number" name="req_carga_kg" id="req_carga_kg" value={req_carga_kg} onInput={this.handleChange} min="0" />
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="req_tipo_vehiculo_preferente">Tipo Vehículo Preferente (opcional):</label>
                        <select name="req_tipo_vehiculo_preferente" id="req_tipo_vehiculo_preferente" value={req_tipo_vehiculo_preferente} onChange={this.handleChange}>
                            {tipoVehiculoChoices.map(choice => (
                                <option key={choice.value} value={choice.value}>{choice.label}</option>
                            ))}
                        </select>
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="req_caracteristicas_especiales">Requerimientos Especiales (opcional):</label>
                        <textarea name="req_caracteristicas_especiales" id="req_caracteristicas_especiales" value={req_caracteristicas_especiales} onInput={this.handleChange} />
                    </div>

                    <div class={formStyle.formGroup}>
                        <label for="observaciones">Observaciones (opcional):</label>
                        <textarea name="observaciones" id="observaciones" value={observaciones} onInput={this.handleChange} />
                    </div>

                    <div class={formStyle.formActions}>
                        <button type="submit" disabled={submitting} class={formStyle.submitButton}>
                            {submitting ? 'Creando...' : 'Crear Asignación'}
                        </button>
                        <button type="button" onClick={props.onCancel} class={formStyle.cancelButton} disabled={submitting}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default AsignacionForm;