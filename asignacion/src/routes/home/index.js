import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { motion } from 'framer-motion';
import style from './style.css';
import logoSSVQ from '../../assets/logo-ssvq.jpg';
import logoUV from '../../assets/u-valparaiso.webp';
import { getVehiculos } from '../../services/vehicleService';
import { getConductores } from '../../services/conductorService';
import { getAsignaciones } from '../../services/asignacionService';

const container = {
  hidden: { opacity: 0 }, // Simpler hidden state for the container
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Stagger for left and right panels
      delayChildren: 0.1,
    }
  }
};
const itemVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 }, // Slightly adjusted for panels
  show:  {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" } // Smoother ease
  }
};



export default function Home() {
  const [resumen, setResumen] = useState({ v:0, c:0, a:0 });
  const steps = [
    { id: 1, icon: '🔑', text: 'Inicia sesión con tus credenciales.' },
    { id: 2, icon: '📝', text: 'Solicita un vehículo disponible.' },
    { id: 3, icon: '🛠️', text: 'Un administrador revisará tu solicitud.' },
    { id: 4, icon: '✅', text: 'Recibe la confirmación y detalles.' },
  ];

  useEffect(() => {
    (async () => {
      try { // Added try-catch for robustness
        const [veh, con, asig] = await Promise.all([
          getVehiculos(), getConductores(), getAsignaciones()
        ]);
        setResumen({
          v:  veh.filter(x=>x.estado==='disponible').length,
          c:  con.filter(x=>x.estado_disponibilidad==='disponible').length,
          a:  asig.filter(x=>x.estado.startsWith('en_')).length
        });
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Optionally set some error state here
      }
    })();
  }, []);

  return (
    <div class={style.homeBg}>
      <motion.div
        class={style.homeSplitContainer}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div class={style.leftPanel} variants={itemVariant}>
          <motion.img
            src={logoSSVQ}
            alt="Logo SSVQ"
            class={style.logoAnimated}
            whileHover={{ scale: 1.05, rotate: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          />
          <h1 class={style.titleAnimated}>Bienvenido al Gestor de Flota Vehicular</h1>
          <h2 class={style.subtitleAnimated}>Servicio de Salud Viña del Mar - Quillota</h2>

          <div class={style.resumenBox}>

            <div class={style.resumenItem}>
              <div class={style.resumenIcon}>🚗</div>
              <span class={style.resumenNumero}>{resumen.v}</span>
              <span class={style.resumenLabel}>Vehículos Disponibles</span>
            </div>
            <div class={style.resumenItem}>
              <div class={style.resumenIcon}>👤</div>
              <span class={style.resumenNumero}>{resumen.c}</span>
              <span class={style.resumenLabel}>Conductores Activos</span>
            </div>
            <div class={style.resumenItem}>
              <div class={style.resumenIcon}>📦</div>
              <span class={style.resumenNumero}>{resumen.a}</span>
              <span class={style.resumenLabel}>Asignaciones en Curso</span>
            </div>
          </div>
        </motion.div>

        <motion.div class={style.rightPanel} variants={itemVariant}>
          <div class={style.tutorialBox}>
            <h3 class={style.tutorialTitle}>¿Cómo usar la plataforma?</h3>
            <ol class={style.tutorialList}>
              {steps.map((step,i) => (
                <motion.li
                  key={step.id} // Use unique id for key
                  class={style.tutorialStep}
                  initial={{ opacity:0, x:-20 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: 0.2 + i*0.15, duration:0.5 }} // Adjusted delay and duration
                >
                  <span class={style.stepIcon}>{step.icon}</span>
                  <span>{step.text}</span>
                </motion.li>
              ))}
            </ol>
            <p class={style.tip}><b>Tip:</b> Si tienes dudas, consulta la ayuda o contacta a soporte.</p>
            <button
              class={style.ctaButton}
              onClick={() => window.location.href = '/asignaciones'}
            >
              ¡Solicita tu vehículo ahora!
            </button>
          </div>
        </motion.div>
      </motion.div>

      <motion.footer
        class={style.creditsFooter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
      >
        <div class={style.footerLogosContainer}>
          <img src={logoSSVQ} alt="Logo SSVQ" class={style.footerLogo} />
          <img src={logoUV} alt="Logo Universidad de Valparaíso" class={style.footerLogo} />
        </div>
        <div class={style.creditsText}>
          <p>Desarrollado por la Escuela de Ingeniería Civil Biomédica UV.</p>
          <p>Servicio de Salud Viña del Mar - Quillota.</p>
          <p>&copy; 2025 Todos los derechos reservados.</p>
        </div>

      </motion.footer>
    </div>
  );
}
