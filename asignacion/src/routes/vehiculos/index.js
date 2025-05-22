// src/routes/vehiculos/index.js
import { h, Component } from 'preact';
import { getVehiculos } from '../../services/vehicleService';
import style from './style.css';
import VehiculoForm from '../../components/vehiculoForm'; // Importar el formulario

class VehiculosPage extends Component {
    state = {
        vehiculos: [],
        loading: true,
        error: null,
        showForm: false, // Nuevo estado para mostrar/ocultar formulario
    };

    componentDidMount() {
        this.cargarVehiculos();
    }

    cargarVehiculos = () => {
        this.setState({ loading: true });
        getVehiculos()
            .then(response => {
                this.setState({
                    vehiculos: response.data.results || response.data,
                    loading: false,
                    error: null,
                });
            })
            .catch(error => {
                console.error("Error fetching vehiculos:", error);
                this.setState({
                    error: 'Error al cargar los vehículos.',
                    loading: false
                });
            });
    }

    // Manejadores para el formulario
    handleShowForm = () => {
        this.setState({ showForm: true });
    }

    handleHideForm = () => {
        this.setState({ showForm: false });
    }

    handleVehiculoCreado = () => {
        this.setState({ showForm: false });
        this.cargarVehiculos(); // Recargar la lista de vehículos
    }

    render(_, { vehiculos, loading, error, showForm }) { // Añadir showForm al destructuring
        if (loading && !showForm) { // No mostrar 'cargando' si el formulario está visible y la lista ya cargó
            return <p>Cargando vehículos...</p>;
        }
        // Mostrar error solo si no estamos mostrando el formulario y hay un error de carga de lista
        if (error && !showForm) {
            return <p style={{ color: 'red' }}>{error}</p>;
        }

        return (
            <div class={style.vehiculosPage}>
                <h1>Listado de Vehículos</h1>
                <button onClick={this.handleShowForm} class={style.addButton}>Agregar Vehículo</button>

                {showForm && (
                    <VehiculoForm
                        onVehiculoCreado={this.handleVehiculoCreado}
                        onCancel={this.handleHideForm}
                    />
                )}

                {/* Mostrar la tabla solo si no está el formulario o si hay vehículos */}
                {(vehiculos.length > 0 || !showForm) && !loading && !error && (
                     <table>
                        <thead>
                            <tr>
                                <th>Patente</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Tipo</th>
                                <th>Pasajeros</th>
                                <th>Estado</th>
                                <th>Foto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.map(v => (
                                <tr key={v.id}>
                                    <td>{v.patente}</td>
                                    <td>{v.marca}</td>
                                    <td>{v.modelo}</td>
                                    <td>{v.tipo_vehiculo}</td>
                                    <td>{v.capacidad_pasajeros}</td>
                                    <td>{v.estado}</td>
                                    <td>
                                        {v.foto_url ? (
                                            <img src={v.foto_url} alt={`Foto de ${v.patente}`} width="50" />
                                        ) : (
                                            'Sin foto'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {vehiculos.length === 0 && !showForm && !loading && !error && (
                    <p>No hay vehículos registrados.</p>
                )}
            </div>
        );
    }
}

export default VehiculosPage;