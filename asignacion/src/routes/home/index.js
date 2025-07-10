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
  
  const features = [
    { 
      id: 1, 
      title: 'Gestión de Vehículos',
      description: 'Administra toda tu flota vehicular con seguimiento en tiempo real.',
      color: 'var(--primary)'
    },
    { 
      id: 2, 
      title: 'Control de Conductores',
      description: 'Gestiona conductores, horarios y disponibilidad con sistema QR.',
      color: 'var(--secondary)'
    },
    { 
      id: 3, 
      title: 'Asignaciones Inteligentes',
      description: 'Automatiza la asignación de vehículos según disponibilidad.',
      color: 'var(--warning)'
    },
    { 
      id: 4, 
      title: 'Acceso QR',
      description: 'Control de acceso mediante códigos QR y cédulas de identidad.',
      color: 'var(--success)'
    }
  ];

  const steps = [
    { id: 1, text: 'Inicia sesión con tus credenciales de acceso.' },
    { id: 2, text: 'Solicita un vehículo según tus necesidades.' },
    { id: 3, text: 'Un administrador revisará y aprobará tu solicitud.' },
    { id: 4, text: 'Recibe la confirmación y detalles del vehículo asignado.' },
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
      {/* Hero Section */}
      <motion.section
        class={style.heroSection}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div class={style.heroContent}>
          <motion.div class={style.heroText} variants={itemVariant}>
            <motion.h1 class={style.heroTitle} variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}>
               Sistema de Gestión de Flota Vehicular
            </motion.h1>
            <motion.p class={style.heroSubtitle} variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6 } } }}>
              Servicio de Salud Viña del Mar - Quillota
            </motion.p>
            <motion.p class={style.heroDescription} variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.4, duration: 0.6 } } }}>
               Plataforma integral para la gestión eficiente de vehículos, conductores y asignaciones 
               con tecnología QR avanzada y control de acceso automatizado.
            </motion.p>
             <div class={style.heroButtons}>
              <motion.button
                class={style.ctaPrimary}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.6 } } }}
                onClick={() => window.location.href = '/asignaciones'}
              >
                 🚗 Solicitar Vehículo
               </motion.button>
              <motion.button
                class={style.ctaSecondary}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { delay: 0.8, duration: 0.6 } } }}
                onClick={() => window.location.href = '/camara'}
              >
                 Acceso QR
               </motion.button>
             </div>
          </motion.div>
          <motion.div class={style.heroImage} variants={itemVariant}>
            <img src={logoSSVQ} alt="Logo SSVQ" class={style.heroLogo} />
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section class={style.statsSection} variants={itemVariant}>
        <div class={style.statsGrid}>
          <div class={style.statCard}>
            <div class={style.statNumber}>{resumen.v}</div>
            <div class={style.statLabel}>Vehículos Disponibles</div>
          </div>
          <div class={style.statCard}>
            <div class={style.statNumber}>{resumen.c}</div>
            <div class={style.statLabel}>Conductores Activos</div>
          </div>
          <div class={style.statCard}>
            <div class={style.statNumber}>{resumen.a}</div>
            <div class={style.statLabel}>Asignaciones en Curso</div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section class={style.featuresSection} variants={container}>
        <div class={style.sectionHeader}>
          <h2 class={style.sectionTitle}>Características Principales</h2>
          <p class={style.sectionSubtitle}>
            Descubre todas las funcionalidades que hacen de nuestro sistema la solución perfecta
          </p>
        </div>
        <div class={style.featuresGrid}>
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              class={style.featureCard}
              variants={itemVariant}
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <div class={style.featureIcon} style={{ backgroundColor: feature.color }}>
                {/* Professional icon space */}
              </div>
              <h3 class={style.featureTitle}>{feature.title}</h3>
              <p class={style.featureDescription}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How it works Section */}
      <motion.section class={style.howItWorksSection} variants={container}>
        <div class={style.sectionHeader}>
          <h2 class={style.sectionTitle}>¿Cómo Funciona?</h2>
          <p class={style.sectionSubtitle}>
            Sigue estos simples pasos para gestionar tu solicitud de vehículo
          </p>
        </div>
        <div class={style.stepsContainer}>
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              class={style.stepCard}
              variants={itemVariant}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
            >
              <div class={style.stepNumber}>{step.id}</div>
              <p class={style.stepText}>{step.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        class={style.footer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
      >
        <div class={style.footerContent}>
          <div class={style.footerLogos}>
            <img src={logoSSVQ} alt="Logo SSVQ" class={style.footerLogo} />
            <img src={logoUV} alt="Logo Universidad de Valparaíso" class={style.footerLogo} />
          </div>
          <div class={style.footerText}>
            <p>Desarrollado por la Escuela de Ingeniería Civil Biomédica UV</p>
            <p>Servicio de Salud Viña del Mar - Quillota</p>
            <p>&copy; 2025 Todos los derechos reservados</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
