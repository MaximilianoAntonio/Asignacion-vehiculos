import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';
import logoSSVQ from '../../assets/LOGOSSVQ.png';

const Header = ({ isLoggedIn, onLogout, userGroup }) => {
    const isFuncionario = Array.isArray(userGroup)
        ? userGroup.some(g => g && g.toLowerCase().includes('funcionario'))
        : (userGroup && userGroup.toLowerCase().includes('funcionario'));

    return (
        <header class={style.header}>
            <div class={style.logoContainer}>
                <img src={logoSSVQ} alt="Logo SSVQ" class={style.logo} />
                <span class={style.title}>Sistema de Gestión Vehicular</span>
            </div>
            <nav class={style.nav}>
                <Link activeClassName={style.active} href="/">
                    Inicio
                </Link>
                <Link activeClassName={style.active} href="/camara">
                    Acceso QR
                </Link>
                {isLoggedIn && (
                    <>
                        {isFuncionario ? (
                            <Link activeClassName={style.active} href="/asignaciones">
                                Asignaciones
                            </Link>
                        ) : (
                            <>
                                <Link activeClassName={style.active} href="/vehiculos">
                                    Vehículos
                                </Link>
                                <Link activeClassName={style.active} href="/conductores">
                                    Conductores
                                </Link>
                                <Link activeClassName={style.active} href="/asignaciones">
                                    Asignaciones
                                </Link>
                                <Link activeClassName={style.active} href="/mantenimiento">
                                    Mantenimiento
                                </Link>
                                <Link activeClassName={style.active} href="/mas-informacion">
                                    Más Información
                                </Link>
                            </>
                        )}
                    </>
                )}
                {isLoggedIn ? (
                    <a href="#" onClick={onLogout} class={style.logout}>
                        Logout
                    </a>
                ) : (
                    <Link activeClassName={style.active} href="/login">
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
};

export default Header;