// src/components/vehiculoForm/index.js
import { h, Component } from 'preact';
import { createVehiculo, updateVehiculo } from '../../services/vehicleService';
import style from './style.css';

class VehiculoForm extends Component {
    state = {
        marca: '',
        modelo: '',
        patente: '',
        tipo_vehiculo: 'auto_funcionario',
        capacidad_pasajeros: 4,
        error: null,
        submitting: false,
    };

    componentDidMount() {
        const { vehiculo } = this.props;
        if (vehiculo) {
            this.setState({
                marca: vehiculo.marca || '',
                modelo: vehiculo.modelo || '',
                patente: vehiculo.patente || '',
                tipo_vehiculo: vehiculo.tipo_vehiculo || 'auto_funcionario',
                capacidad_pasajeros: vehiculo.capacidad_pasajeros || 4
            });
        }
    }

    handleChange = (e) => {
        const value = e.target.type === 'number' ? parseInt(e.target.value, 10) : e.target.value;
        this.setState({ [e.target.name]: value });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.setState({ submitting: true, error: null });

        const { marca, modelo, patente, tipo_vehiculo, capacidad_pasajeros } = this.state;
        const vehiculoData = { marca, modelo, patente, tipo_vehiculo, capacidad_pasajeros };

        const promise = this.props.vehiculo
            ? updateVehiculo(this.props.vehiculo.id, vehiculoData)
            : createVehiculo(vehiculoData);

        promise
            .then(() => {
                if (this.props.onVehiculoCreado) {
                    this.props.onVehiculoCreado(); // También sirve para "actualizado"
                }
            })
            .catch(error => {
                console.error("Error en el formulario:", error.response);
                let errorMessage = 'Error al procesar el vehículo.';
                if (error.response && error.response.data) {
                    const errors = error.response.data;
                    const messages = Object.keys(errors)
                        .map(key => `${key}: ${errors[key].join ? errors[key].join(', ') : errors[key]}`)
                        .join(' ');
                    if (messages) errorMessage += ` Detalles: ${messages}`;
                }
                this.setState({ error: errorMessage, submitting: false });
            });
    };

    render(props, { marca, modelo, patente, tipo_vehiculo, capacidad_pasajeros, error, submitting }) {
        const tipoVehiculoChoices = [
            { value: 'auto_funcionario', label: 'Auto para Funcionarios' },
            { value: 'furgon_insumos', label: 'Furgón para Insumos' },
            { value: 'ambulancia', label: 'Ambulancia para Pacientes' },
            { value: 'camioneta_grande', label: 'Camioneta Grande Pasajeros' },
            { value: 'camion_carga', label: 'Camión de Carga Ligera' },
            { value: 'otro', label: 'Otro' },
        ];

        const esEdicion = !!props.vehiculo;

        return (
            <div class={style.formContainer}>
                <h3>{esEdicion ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}</h3>
                {error && <p class={style.error}>{error}</p>}
                <form onSubmit={this.handleSubmit}>
                    <div class={style.formGroup}>
                        <label for="patente">Patente:</label>
                        <input type="text" name="patente" id="patente" value={patente} onInput={this.handleChange} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="marca">Marca:</label>
                        <input type="text" name="marca" id="marca" value={marca} onInput={this.handleChange} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="modelo">Modelo:</label>
                        <input type="text" name="modelo" id="modelo" value={modelo} onInput={this.handleChange} required />
                    </div>
                    <div class={style.formGroup}>
                        <label for="tipo_vehiculo">Tipo de Vehículo:</label>
                        <select name="tipo_vehiculo" id="tipo_vehiculo" value={tipo_vehiculo} onChange={this.handleChange}>
                            {tipoVehiculoChoices.map(choice => (
                                <option key={choice.value} value={choice.value}>{choice.label}</option>
                            ))}
                        </select>
                    </div>
                    <div class={style.formGroup}>
                        <label for="capacidad_pasajeros">Capacidad Pasajeros:</label>
                        <input type="number" name="capacidad_pasajeros" id="capacidad_pasajeros" value={capacidad_pasajeros} onInput={this.handleChange} min="1" required />
                    </div>
                    <div class={style.formActions}>
                        <button type="submit" disabled={submitting} class={style.submitButton}>
                            {submitting
                                ? (esEdicion ? 'Guardando...' : 'Agregando...')
                                : (esEdicion ? 'Guardar Cambios' : 'Agregar Vehículo')}
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

export default VehiculoForm;
