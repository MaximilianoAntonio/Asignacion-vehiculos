import { h, Component } from 'preact';
import { route } from 'preact-router';
import style from './style.css'; // Crearemos este archivo CSS
import AsignacionForm from '../../components/asignacionForm';
import { createAsignacion } from '../../services/asignacionService';
import { isAuthenticated, isSolicitante, getUserInfo } from '../../services/authService';

export default class SolicitarTrasladoPage extends Component {
    state = {
        error: null,
        success: null,
        isLoading: false,
        // Clave para forzar el reseteo del formulario si es necesario
        formKey: Date.now(), 
        initialFormData: {
            // Podemos pre-poblar el nombre del solicitante si está logueado
            solicitante_nombre: '', 
            // Otros campos pueden tener defaults del AsignacionForm
        }, 
    };

    componentDidMount() {
        if (!isAuthenticated() || !isSolicitante()) {
            route('/login', true); // Redirigir si no está autorizado
            return;
        }
        this.prepareInitialData();
    }

    prepareInitialData = () => {
        const userInfo = getUserInfo();
        if (userInfo) {
            this.setState(prevState => ({
                initialFormData: {
                    ...prevState.initialFormData, // Mantener otros defaults si los hay
                    solicitante_nombre: userInfo.full_name || userInfo.username || '',
                    // No pre-poblamos solicitante_telefono o jerarquia aquí,
                    // ya que el usuario debe ingresarlos según la necesidad de la solicitud.
                }
            }));
        }
    }

    handleSubmit = async (formDataFromForm) => {
        this.setState({ isLoading: true, error: null, success: null });

        // El AsignacionForm en modo 'solicitud' ya debería omitir campos de admin.
        // El backend se encargará de 'solicitante_usuario' y el 'estado' inicial.
        // formDataFromForm ya viene con los campos correctos del formulario.

        // Campos que el backend auto-asigna o no son relevantes para la creación por solicitante
        delete formDataFromForm.id;
        delete formDataFromForm.vehiculo;
        delete formDataFromForm.conductor;
        delete formDataFromForm.estado; // El backend lo pone en 'pendiente_auto'
        delete formDataFromForm.observaciones; // No para solicitantes al crear
        delete formDataFromForm.fecha_hora_fin_real;

        // El backend tomará solicitante_nombre del usuario logueado si este campo
        // se omite o es solo de display. Si el form lo envía, el backend lo puede usar
        // o sobreescribir. Aquí, como AsignacionForm lo tiene, lo dejamos.

        try {
            const newAsignacion = await createAsignacion(formDataFromForm); // asignacionService.js
            this.setState({
                success: `Solicitud de traslado #${newAsignacion.id} creada exitosamente. Estado: ${newAsignacion.estado}.`,
                isLoading: false,
                formKey: Date.now(), // Cambiar la clave para resetear el AsignacionForm
                // Re-preparar initialFormData para el siguiente formulario
                // (puede que necesitemos mantener solicitante_nombre pre-poblado)
            });
            this.prepareInitialData(); // Para que el nombre se mantenga en el form "limpio"

        } catch (err) {
            console.error("Error creando asignación:", err);
            let errorMessage = 'Error al crear la solicitud.';
            if (err.response && err.response.data) {
                // Formatear errores del backend si están disponibles
                errorMessage = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('; ');
            } else if (err.message) {
                errorMessage = err.message;
            }
            this.setState({ error: errorMessage, isLoading: false });
        }
    };

    render(_, { error, success, isLoading, initialFormData, formKey }) {
        return (
            <div class={style.solicitarTrasladoContainer}>
                <div class={style.solicitarTrasladoPage}>
                    <h1>Solicitar Nuevo Traslado</h1>
                    <p>Complete el siguiente formulario para solicitar un nuevo traslado.</p>

                    {success && <p class={style.successMessage}>{success}</p>}
                    {error && <p class={style.errorMessage}>{error}</p>}

                    <AsignacionForm
                        key={formKey} // Importante para el reseteo del formulario
                        onSubmit={this.handleSubmit}
                        initialData={initialFormData}
                        mode="solicitud" // Modo específico para esta página
                        isLoading={isLoading}
                        submitText="Enviar Solicitud"
                    />
                </div>
            </div>
        );
    }
}