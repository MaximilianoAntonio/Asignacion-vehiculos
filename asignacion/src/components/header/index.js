import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

const Header = ({ isLoggedIn, onLogout, userGroup }) => {
    const isFuncionario = Array.isArray(userGroup)
        ? userGroup.some(g => g && g.toLowerCase().includes('funcionario'))
        : (userGroup && userGroup.toLowerCase().includes('funcionario'));

    return (
        <header class={style.header}>
            <div class={style.logoContainer}>
                <img src="/assets/logo-ssvq.jpg" alt="Logo" class={style.logo} />
                <span class={style.title}>Gestión de Flota</span>
            </div>
            <nav class={style.nav}>
                <Link activeClassName={style.active} href="/">Inicio</Link>
                <Link activeClassName={style.active} href="/camara">Cámara</Link>
                {isLoggedIn && (
                    <>
                        {isFuncionario ? (
                            <Link activeClassName={style.active} href="/asignaciones">Asignaciones</Link>
                        ) : (
                            <>
                                <div class={style.dropdown}>
                                    <a onClick={e => e.preventDefault()} href="#" class={style.dropbtn}>Gestión</a>
                                    <div class={style.dropdownContent}>
                                        <Link activeClassName={style.active} href="/vehiculos">Vehículos</Link>
                                        <Link activeClassName={style.active} href="/conductores">Conductores</Link>
                                        <Link activeClassName={style.active} href="/asignaciones">Asignaciones</Link>
                                    </div>
                                </div>
                                <div class={style.dropdown}>
                                    <a onClick={e => e.preventDefault()} href="#" class={style.dropbtn}>Planificación</a>
                                    <div class={style.dropdownContent}>
                                        <Link activeClassName={style.active} href="/horarios">Horarios</Link>
                                        <Link activeClassName={style.active} href="/mantenimiento">Mantenimiento</Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
                {isLoggedIn ? (
                    <a href="#" onClick={onLogout} class={style.logout}>Logout</a>
                ) : (
                    <Link activeClassName={style.active} href="/login">Login</Link>
                )}
            </nav>
        </header>
    );
};

export default Header;