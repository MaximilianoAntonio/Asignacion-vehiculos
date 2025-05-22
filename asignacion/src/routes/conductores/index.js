// src/routes/conductores/index.js
import { h, Component } from 'preact';
import { getConductores, createConductor } from '../../services/conductorService';
import style from './style.css'; // Crearemos este archivo
import ConductorForm from '../../components/conductorForm'; // Crearemos este componente

class ConductoresPage extends Component {
    state = {
        conductores: [],
        loading: true,
        error: null,
        showForm: false,
    };

    componentDidMount() {
        this.cargarConductores();
    }

    cargarConductores = () => {
        this.setState({ loading: true });
        getConductores()
            .then(response => {
                this.setState({
                    conductores: response.data.results || response.data,
                    loading: false,
                    error: null,
                });
            })
            .catch(error => {
                console.error("Error fetching conductores:", error);
                this.setState({
                    error: 'Error al cargar los conductores.',
                    loading: false
                });
            });
    }

    handleShowForm = () => {
        this.setState({ showForm: true });
    }

    handleHideForm = () => {
        this.setState({ showForm: false });
    }

    handleConductorCreado = () => {
        this.setState({ showForm: false });
        this.cargarConductores(); // Recargar la lista de conductores
    }

    render(_, { conductores, loading, error, showForm }) {
        if (loading) {
            return <p>Cargando conductores...</p>;
        }
        if (error) {
            return <p style={{ color: 'red' }}>{error}</p>;
        }

        return (
            <div class={style.conductoresPage}>
                <h1>Listado de Conductores</h1>
                <button onClick={this.handleShowForm} class={style.addButton}>Agregar Conductor</button>

                {showForm && (
                    <ConductorForm
                        onConductorCreado={this.handleConductorCreado}
                        onCancel={this.handleHideForm}
                    />
                )}

                {conductores.length === 0 && !showForm ? (
                    <p>No hay conductores registrados.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Nº Licencia</th>
                                <th>Vencimiento Licencia</th>
                                <th>Activo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conductores.map(c => (
                                <tr key={c.id}>
                                    <td>{c.nombre}</td>
                                    <td>{c.apellido}</td>
                                    <td>{c.numero_licencia}</td>
                                    <td>{new Date(c.fecha_vencimiento_licencia).toLocaleDateString()}</td>
                                    <td>{c.activo ? 'Sí' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }
}

export default ConductoresPage;