// src/components/header/index.js
import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

const Header = ({ isLoggedIn, onLogout }) => (
    <header class={style.header}>
        <h1>Gestor de Vehículos</h1>
        <nav>
            <Link activeClassName={style.active} href="/">Inicio</Link>
            {isLoggedIn && (
                <>
                    <Link activeClassName={style.active} href="/vehiculos">Vehículos</Link>
                    <Link activeClassName={style.active} href="/conductores">Conductores</Link>
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

export default Header;