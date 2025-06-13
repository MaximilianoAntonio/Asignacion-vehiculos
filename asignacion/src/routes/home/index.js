import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import style from './style.css';
import logoSSVQ from '../../assets/logo-ssvq.jpg';
import { getVehiculos } from '../../services/vehicleService';
import { getConductores } from '../../services/conductorService';
import { getAsignaciones } from '../../services/asignacionService';

// Animación de varios autos avanzando rápidamente con "tierra"
const AnimatedCarsRow = () => (
  <div class={style.carsRow}>
    {/* Auto Estilo 1: Deportivo */}
    <div class={style.carWrapper} style={{ animationDelay: '0s' }}>
      <svg class={style.carSvg} width="80" height="35" viewBox="0 0 80 35" fill="none">
        <path d="M5 23C2.79086 23 1 21.2091 1 19V14C1 11.7909 2.79086 10 5 10H12L18 5H62L68 10H75C77.2091 10 79 11.7909 79 14V19C79 21.2091 77.2091 23 75 23H5Z" fill="#c0392b"/>
        <path d="M15 10H65V18H15V10Z" fill="#e74c3c"/>
        <rect x="20" y="3" width="40" height="7" rx="2" fill="#ecf0f1"/>
        <circle cx="18" cy="25" r="6" fill="#2c3e50"/>
        <circle cx="18" cy="25" r="3" fill="#bdc3c7"/>
        <circle cx="62" cy="25" r="6" fill="#2c3e50"/>
        <circle cx="62" cy="25" r="3" fill="#bdc3c7"/>
        <ellipse class={style.dust} cx="10" cy="31" rx="8" ry="2.5" fill="#b2bec3" />
      </svg>
    </div>

    {/* Auto Estilo 2: Clásico/Sedan */}
    <div class={style.carWrapper} style={{ animationDelay: '0.8s' }}>
      <svg class={style.carSvg} width="75" height="38" viewBox="0 0 75 38" fill="none">
        <rect x="1" y="15" width="73" height="15" rx="4" fill="#3498db"/>
        <path d="M10 15L20 5H55L65 15H10Z" fill="#5dade2"/>
        <rect x="22" y="7" width="12" height="8" rx="1" fill="#ecf0f1"/>
        <rect x="41" y="7" width="12" height="8" rx="1" fill="#ecf0f1"/>
        <circle cx="15" cy="30" r="7" fill="#34495e"/>
        <circle cx="15" cy="30" r="3.5" fill="#95a5a6"/>
        <circle cx="60" cy="30" r="7" fill="#34495e"/>
        <circle cx="60" cy="30" r="3.5" fill="#95a5a6"/>
        <ellipse class={style.dust} cx="8" cy="36" rx="9" ry="3" fill="#b2bec3" />
      </svg>
    </div>

    {/* Auto Estilo 3: Camioneta Pequeña */}
    <div class={style.carWrapper} style={{ animationDelay: '1.6s' }}>
      <svg class={style.carSvg} width="85" height="40" viewBox="0 0 85 40" fill="none">
        <rect x="1" y="18" width="60" height="15" rx="3" fill="#27ae60"/>
        <rect x="45" y="10" width="38" height="23" rx="3" fill="#2ecc71"/>
        <path d="M5 18L15 8H45V18H5Z" fill="#2ecc71"/>
        <rect x="18" y="10" width="25" height="8" rx="1" fill="#ecf0f1"/>
        <circle cx="18" cy="33" r="7" fill="#555"/>
        <circle cx="18" cy="33" r="3" fill="#ccc"/>
        <circle cx="67" cy="33" r="7" fill="#555"/>
        <circle cx="67" cy="33" r="3" fill="#ccc"/>
        <ellipse class={style.dust} cx="10" cy="38" rx="10" ry="3.5" fill="#b2bec3" />
      </svg>
    </div>
  </div>
);

const steps = [
  { text: 'Inicia sesión con tu usuario y contraseña institucional.', icon: '🔑' },
  { text: 'Accede al menú superior para ver vehículos, conductores y asignaciones.', icon: '📋' },
  { text: 'Para solicitar un vehículo, dirígete a Asignaciones y haz clic en Solicitar nuevo.', icon: '📝' },
  { text: 'Completa el formulario y espera la confirmación.', icon: '✅' },
  { text: 'Puedes revisar el estado de tus solicitudes en la misma sección.', icon: '🔎' },
];

const Home = () => {
  const [resumen, setResumen] = useState({
    vehiculosDisponibles: 0,
    conductoresActivos: 0,
    rutasActivas: 0,
  });

  useEffect(() => {
    async function cargarResumen() {
      try {
        const [vehiculos, conductores, asignaciones] = await Promise.all([
          getVehiculos(),
          getConductores(),
          getAsignaciones(),
        ]);
        setResumen({
          vehiculosDisponibles: vehiculos.filter(v => v.estado === 'disponible').length,
          conductoresActivos: conductores.filter(c => c.estado_disponibilidad === 'disponible').length,
          rutasActivas: asignaciones.filter(a => a.estado && a.estado.startsWith('en_')).length,
        });
      } catch (e) {
        // Si hay error, deja los valores en 0
      }
    }
    cargarResumen();
  }, []);

  return (
    <div class={style.homeBg}>
      <div class={style.particles}></div>
      <div class={style.homeSplitContainer}>
        <div class={style.leftPanel}>
          <img src={logoSSVQ} alt="Logo SSVQ" class={style.logoAnimated} />
          <h1 class={style.titleAnimated}>Bienvenido al Gestor de Vehículos</h1>
          <h2 class={style.subtitleAnimated}>Servicio de Salud Valparaíso - San Antonio</h2>
          {/* Resumen de datos */}
          <div class={style.resumenBox}>
            <div class={style.resumenItem}>
              <span class={style.resumenNumero}>{resumen.vehiculosDisponibles}</span>
              <span class={style.resumenLabel}>Vehículos Disponibles</span>
            </div>
            <div class={style.resumenItem}>
              <span class={style.resumenNumero}>{resumen.conductoresActivos}</span>
              <span class={style.resumenLabel}>Conductores Activos</span>
            </div>
            <div class={style.resumenItem}>
              <span class={style.resumenNumero}>{resumen.rutasActivas}</span>
              <span class={style.resumenLabel}>Rutas Activas</span>
            </div>
          </div>
          <AnimatedCarsRow />
        </div>
        <div class={style.rightPanel}>
          <div class={style.tutorialBox}>
            <h3 class={style.tutorialTitle}>¿Cómo usar la plataforma?</h3>
            <ol class={style.tutorialList}>
              {steps.map((step, i) => (
                <li class={style.tutorialStep} style={{ animationDelay: `${0.3 + i * 0.2}s` }}>
                  <span class={style.stepIcon}>{step.icon}</span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
            <p class={style.tip}><b>Tip:</b> Si tienes dudas, consulta la ayuda o contacta a soporte.</p>
            <button class={style.ctaButton}>¡Solicita tu vehículo ahora!</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
