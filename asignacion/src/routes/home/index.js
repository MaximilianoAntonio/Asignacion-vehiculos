import { h } from 'preact';
import style from './style.css';
import logoSSVQ from '../../assets/logo-ssvq.jpg'; // asegúrate que esté en esa ruta

const Home = () => (
  <div class={style.homeContainer}>
    <img src={logoSSVQ} alt="Logo SSVQ" class={style.logo} />
    <h1 class={style.fadeIn}>Bienvenido al Gestor de Vehículos</h1>
    <h2 class={style.fadeIn2}>Servicio de Salud Valparaíso - San Antonio</h2>
    <span class={style.carEmoji}>🚗</span>
    <div class={style.tutorialBox}>
      <h3>¿Cómo usar la plataforma?</h3>
      <ol>
        <li><b>Inicia sesión</b> con tu usuario y contraseña institucional.</li>
        <li>Accede al menú superior para ver <b>vehículos</b>, <b>conductores</b> y <b>asignaciones</b>.</li>
        <li>Para solicitar un vehículo, dirígete a <b>Asignaciones</b> y haz clic en <b>Solicitar nuevo</b>.</li>
        <li>Completa el formulario y espera la confirmación.</li>
        <li>Puedes revisar el estado de tus solicitudes en la misma sección.</li>
      </ol>
      <p class={style.tip}><b>Tip:</b> Si tienes dudas, consulta la ayuda o contacta a soporte.</p>
    </div>
  </div>
);

export default Home;
