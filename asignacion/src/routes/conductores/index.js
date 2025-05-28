// src/routes/conductores/index.js
import { h, Component } from 'preact';
import { getConductores, createConductor } from '../../services/conductorService';
import style from './style.css'; // Crearemos este archivo
import ConductorForm from '../../components/conductorForm'; // Crearemos este componente
import { deleteConductor } from '../../services/conductorService';

class ConductoresPage extends Component {
    state = {
        conductores: [],
        loading: true,
        error: null,
        showForm: false,
        conductorEditando: null, // 👈 nuevo
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
        this.setState({ showForm: false, conductorEditando: null });
    }

    handleConductorCreado = () => {
        this.setState({ showForm: false, conductorEditando: null });
        this.cargarConductores(); // Recargar lista
    }

    handleDeleteConductor = (conductor) => {
        const confirmado = window.confirm(`¿Estás seguro de que deseas eliminar al conductor ${conductor.nombre} ${conductor.apellido}?`);
        if (confirmado) {
            deleteConductor(conductor.id)
            .then(() => this.cargarConductores())
            .catch(error => {
                console.error('Error al eliminar el conductor:', error);
                alert('Ocurrió un error al eliminar el conductor.');
            });
        }
    };


    handleEditConductor = (conductor) => {
        this.setState({
            showForm: true,
            conductorEditando: conductor,
        });
    };


    render(_, { conductores, loading, error, showForm }) {
        if (loading) {
            return <p>Cargando conductores...</p>;
        }
        if (error) {
            return <p style={{ color: 'red' }}>{error}</p>;
        }

        return (
            <div class={style.conductoresPage}>
                <div className={style.encabezado}>
                    <h1>Listado de Conductores</h1>
                    <button onClick={this.handleShowForm} className={style.addButton}>Agregar Conductor</button>
                </div>
        
                {showForm && (
                    <ConductorForm
                        conductor={this.state.conductorEditando}
                        onConductorCreado={this.handleConductorCreado}
                        onCancel={this.handleHideForm}
                    />
                )}

                <div className={style.tableContainer}>
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
                                    <th>Acciones</th>
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
                                        <td>
                                            <button onClick={() => this.handleEditConductor(c)} className={style.editButton}>✏️ Editar</button>
                                            <button onClick={() => this.handleDeleteConductor(c)} className={style.deleteButton}>🗑️ Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }
}

export default ConductoresPage;