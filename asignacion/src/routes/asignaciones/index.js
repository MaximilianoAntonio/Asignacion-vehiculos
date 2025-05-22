// src/routes/asignaciones/index.js
import { h, Component } from 'preact';
import { getAsignaciones } from '../../services/asignacionService';
import { getVehiculos } from '../../services/vehicleService'; // Para select de vehículos
import { getConductores } from '../../services/conductorService'; // Para select de conductores
import AsignacionForm from '../../components/asignacionForm'; // Crearemos este
import style from './style.css';

class AsignacionesPage extends Component {
    state = {
        asignaciones: [],
        vehiculos: [], // Para el formulario
        conductores: [], // Para el formulario
        loading: true,
        error: null,
        showForm: false,
    };

    componentDidMount() {
        this.cargarDatos();
    }

    cargarDatos = async () => {
        this.setState({ loading: true });
        try {
            const [asignacionesRes, vehiculosRes, conductoresRes] = await Promise.all([
                getAsignaciones(),
                getVehiculos(), // Cargar para los <select> del formulario
                getConductores()  // Cargar para los <select> del formulario
            ]);
            this.setState({
                asignaciones: asignacionesRes.data.results || asignacionesRes.data,
                vehiculos: vehiculosRes.data.results || vehiculosRes.data,
                conductores: conductoresRes.data.results || conductoresRes.data,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error("Error fetching data for asignaciones:", error);
            this.setState({
                error: 'Error al cargar los datos de asignaciones.',
                loading: false
            });
        }
    }

    handleShowForm = () => this.setState({ showForm: true });
    handleHideForm = () => this.setState({ showForm: false });

    handleAsignacionCreada = () => {
        this.setState({ showForm: false });
        this.cargarDatos(); // Recargar la lista
    }

    formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try {
            return new Date(dateTimeString).toLocaleString();
        } catch (e) {
            return dateTimeString; // Devolver el original si hay error de parseo
        }
    }

    render(_, { asignaciones, vehiculos, conductores, loading, error, showForm }) {
        if (loading && !showForm) {
            return <p>Cargando asignaciones...</p>;
        }
        if (error && !showForm) {
            return <p style={{ color: 'red' }}>{error}</p>;
        }

        return (
            <div class={style.asignacionesPage + " page-content"}>
                <h1>Listado de Asignaciones</h1>
                <button onClick={this.handleShowForm} class={style.addButton}>Crear Asignación</button>

                {showForm && (
                    <AsignacionForm
                        onAsignacionCreada={this.handleAsignacionCreada}
                        onCancel={this.handleHideForm}
                        vehiculosDisponibles={vehiculos} // Pasar vehículos al form
                        conductoresDisponibles={conductores} // Pasar conductores al form
                    />
                )}

                {asignaciones.length === 0 && !showForm ? (
                    <p>No hay asignaciones registradas.</p>
                ) : (
                    <table class={style.dataTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo Servicio</th>
                                <th>Vehículo</th>
                                <th>Conductor</th>
                                <th>Destino</th>
                                <th>F. Solicitud</th>
                                <th>F. Requerida Inicio</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asignaciones.map(a => (
                                <tr key={a.id}>
                                    <td>{a.id}</td>
                                    <td>{a.tipo_servicio}</td>
                                    <td>{a.vehiculo ? `${a.vehiculo.marca} <span class="math-inline">\{a\.vehiculo\.modelo\} \(</span>{a.vehiculo.patente})` : 'N/A'}</td>
                                    <td>{a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : 'N/A'}</td>
                                    <td>{a.destino_descripcion}</td>
                                    <td>{this.formatDateTime(a.fecha_hora_solicitud)}</td>
                                    <td>{this.formatDateTime(a.fecha_hora_requerida_inicio)}</td>
                                    <td>{a.estado}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }
}

export default AsignacionesPage;