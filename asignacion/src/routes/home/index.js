import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { motion } from 'framer-motion';
import style from './style.css';
import logoSSVQ from '../../assets/logo-ssvq.jpg';
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

// Car definitions
const carData = [
  {
    delay: 0,
    width: 80, height: 35, duration: 2.8,
    svg: `<svg width="80" height="35" viewBox="0 0 80 35" fill="none">
      <path d="M5 23C2.79 23 1 21.21 1 19V14C1 11.79 2.79 10 5 10H12L18 5H62L68 10H75C77.21 10 79 11.79 79 14V19C79 21.21 77.21 23 75 23H5Z" fill="#60A5FA"/>
      <path d="M15 10H65V18H15V10Z" fill="#93C5FD"/>
      <rect x="20" y="3" width="40" height="7" rx="2" fill="#E5E7EB"/>
      <circle cx="18" cy="25" r="6" fill="#1F2937"/>
      <circle cx="18" cy="25" r="3" fill="#9CA3AF"/>
      <circle cx="62" cy="25" r="6" fill="#1F2937"/>
      <circle cx="62" cy="25" r="3" fill="#9CA3AF"/>
      <ellipse class="dust" cx="10" cy="31" rx="8" ry="2.5" fill="#D1D5DB"/>
    </svg>`
  },
  {
    delay: 0.8,
    width: 75, height: 38, duration: 3.2,
    svg: `<svg width="75" height="38" viewBox="0 0 75 38" fill="none">
      <rect x="1" y="15" width="73" height="15" rx="4" fill="#2563EB"/>
      <path d="M10 15L20 5H55L65 15H10Z" fill="#3B82F6"/>
      <rect x="22" y="7"  width="12" height="8" rx="1" fill="#F3F4F6"/>
      <rect x="41" y="7"  width="12" height="8" rx="1" fill="#F3F4F6"/>
      <circle cx="15" cy="30" r="7" fill="#111827"/>
      <circle cx="15" cy="30" r="3.5" fill="#6B7280"/>
      <circle cx="60" cy="30" r="7" fill="#111827"/>
      <circle cx="60" cy="30" r="3.5" fill="#6B7280"/>
      <ellipse class="dust" cx="8" cy="36" rx="9" ry="3" fill="#D1D5DB"/>
    </svg>`
  },
  {
    delay: 1.6,
    width: 85, height: 40, duration: 3.0,
    svg: `<svg width="85" height="40" viewBox="0 0 85 40" fill="none">
      <rect x="1" y="18" width="60" height="15" rx="3" fill="#3B82F6"/>
      <rect x="45" y="10" width="38" height="23" rx="3" fill="#60A5FA"/>
      <path d="M5 18L15 8H45V18H5Z" fill="#60A5FA"/>
      <rect x="18" y="10" width="25" height="8" rx="1" fill="#E5E7EB"/>
      <circle cx="18" cy="33" r="7" fill="#1F2937"/>
      <circle cx="18" cy="33" r="3" fill="#9CA3AF"/>
      <circle cx="67" cy="33" r="7" fill="#1F2937"/>
      <circle cx="67" cy="33" r="3" fill="#9CA3AF"/>
      <ellipse class="dust" cx="10" cy="38" rx="10" ry="3.5" fill="#D1D5DB"/>
    </svg>`
  }
];

const AnimatedCarsRow = () => (
  <div class={style.carsRow}>
    {carData.map((c,i) => (
      <motion.div
        key={i}
        class={style.carWrapper}
        initial={{ x: -c.width, opacity: 0, y:0 }}
        animate={{
          x: [ -c.width, 240 ], // Drive across
          y: [0, -2, 0, 1, 0, -1, 0], // Subtle bounce
          opacity: [0, 1, 1, 1, 0] // Fade in, stay, fade out
        }}
        transition={{
          delay: c.delay,
          duration: c.duration,
          ease: "linear", // Constant speed for x
          repeat: Infinity,
          repeatType: "loop",
          opacity: { // Custom timing for opacity within the duration
            times: [0, 0.15, 0.85, 1], // Opacity keyframe times
            ease: "easeInOut"
          },
          y: { // Custom timing for y bounce
            duration: c.duration / 2, // Bounce faster
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror" // Bounce up and down smoothly
          }
        }}
      >
        <div class={style.carSvg} dangerouslySetInnerHTML={{ __html: c.svg }} />
      </motion.div>
    ))}
  </div>
);

export default function Home() {
  const [resumen, setResumen] = useState({ v:0, c:0, a:0 });
  const steps = [
    { id: 1, icon: '🔑', text: 'Inicia sesión con tus credenciales.' },
    { id: 2, icon: '🚗', text: 'Solicita un vehículo disponible.' },
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
          <h2 class={style.subtitleAnimated}>Servicio de Salud Valparaíso - San Antonio</h2>

          <div class={style.resumenBox}>
            {/* Resumen items can optionally have their own stagger if desired, */}
            {/* but for now, they will appear with the leftPanel. */}
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

          <AnimatedCarsRow/>
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
    </div>
  );
}
