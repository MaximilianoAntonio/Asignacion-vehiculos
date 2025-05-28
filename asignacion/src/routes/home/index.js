import { h } from 'preact';
import style from './style.css';
import logoSSVQ from '../../assets/logo-ssvq.jpg'; // asegúrate que esté en esa ruta

const Home = () => (
  <div class={style.homeContainer}>
    <img src={logoSSVQ} alt="Logo SSVQ" class={style.logo} />
    <h1>Bienvenido al Gestor de Vehículos</h1>
    <h2>Servicio de Salud Valparaíso - San Antonio</h2>
    <span class={style.carEmoji}>🚗</span>
  </div>
);

export default Home;
