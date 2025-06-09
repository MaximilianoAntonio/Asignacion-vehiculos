// src/components/header/index.js
import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

const Header = ({ isLoggedIn, onLogout, userGroup }) => {
    // Detecta si el grupo es funcionario (insensible a mayúsculas y plural)
    const isFuncionario = userGroup && userGroup.toLowerCase().startsWith('funcionario');

    return (
        <header class={style.header}>
            <nav>
                <Link activeClassName={style.active} href="/">Inicio</Link>
                {isLoggedIn && (
                    <>
                        {!isFuncionario && (
                            <>
                                <Link activeClassName={style.active} href="/vehiculos">Vehículos</Link>
                                <Link activeClassName={style.active} href="/conductores">Conductores</Link>
                            </>
                        )}
                        <Link activeClassName={style.active} href="/asignaciones">Asignaciones</Link>
                    </>
                )}
                {isLoggedIn ? (
                    <a href="#" onClick={onLogout} style={{ cursor: 'pointer' }}>Logout</a>
                ) : (
                    <Link activeClassName={style.active} href="/login">Login</Link>
                )}
            </nav>
        </header>
    );
};

export default Header;