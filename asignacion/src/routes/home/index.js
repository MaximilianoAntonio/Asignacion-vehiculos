import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { motion } from 'framer-motion';
import style from './style.css';
import logoSSVQ from '../../assets/logo-ssvq.jpg';
import logoUV from '../../assets/u-valparaiso.webp';
import fachadaSSVQ from '../../assets/ssvqfachada.png';
import { getVehiculos } from '../../services/vehicleService';
import { getConductores } from '../../services/conductorService';
import { getAsignaciones } from '../../services/asignacionService';

// Animaciones más elegantes y profesionales
const pageContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.2
    }
  }
};

const textReveal = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const imageFloat = {
  hidden: { opacity: 0, scale: 0.8, rotateY: -20 },
  show: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { duration: 1, ease: "easeOut" }
  }
};

const cardHover = {
  rest: { scale: 1, y: 0, rotateX: 0 },
  hover: {
    scale: 1.03,
    y: -8,
    rotateX: 5,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};



export default function Home() {
  const [resumen, setResumen] = useState({ v:0, c:0, a:0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const features = [
    { 
      id: 1, 
      title: 'Gestión Inteligente de Flota',
      description: 'Sistema avanzado de administración vehicular con monitoreo en tiempo real, mantenimiento predictivo y optimización de recursos.',
      color: 'var(--primary)',
      icon: '🚗',
      gradient: 'linear-gradient(135deg, #3B82F6, #1E40AF)'
    },
    { 
      id: 2, 
      title: 'Control Biométrico de Acceso',
      description: 'Tecnología QR de última generación con validación biométrica, control de horarios y gestión automatizada de conductores.',
      color: 'var(--secondary)',
      icon: '�',
      gradient: 'linear-gradient(135deg, #10B981, #059669)'
    },
    { 
      id: 3, 
      title: 'Asignaciones con IA',
      description: 'Algoritmos inteligentes que optimizan la asignación de vehículos según disponibilidad, proximidad y eficiencia energética.',
      color: 'var(--warning)',
      icon: '🎯',
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    { 
      id: 4, 
      title: 'Dashboard Analítico',
      description: 'Reportes avanzados, métricas en tiempo real y análisis predictivo para la toma de decisiones estratégicas.',
      color: 'var(--success)',
      icon: '�',
      gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
    }
  ];

  const steps = [
    { 
      id: 1, 
      text: 'Accede al portal con credenciales seguras y autenticación biométrica avanzada.', 
      icon: '🔐',
      detail: 'Sistema de autenticación multicapa'
    },
    { 
      id: 2, 
      text: 'Solicita un vehículo específico según tus necesidades operativas y de ruta.', 
      icon: '📋',
      detail: 'Interfaz intuitiva y personalizable'
    },
    { 
      id: 3, 
      text: 'El sistema evalúa automáticamente disponibilidad y asigna el recurso óptimo.', 
      icon: '🤖',
      detail: 'Inteligencia artificial integrada'
    },
    { 
      id: 4, 
      text: 'Recibe confirmación instantánea con detalles completos y códigos QR de acceso.', 
      icon: '✅',
      detail: 'Notificaciones en tiempo real'
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [veh, con, asig] = await Promise.all([
          getVehiculos(), getConductores(), getAsignaciones()
        ]);
        setResumen({
          v: veh.filter(x=>x.estado==='disponible').length,
          c: con.filter(x=>x.estado_disponibilidad==='disponible').length,
          a: asig.filter(x=>x.estado.startsWith('en_')).length
        });
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <motion.div 
      class={style.homeBg}
      variants={pageContainer}
      initial="hidden"
      animate="show"
    >
      {/* Hero Section Mejorado */}
      <motion.section
        class={style.heroSection}
        variants={heroVariants}
      >
        <div class={style.heroContainer}>
          <motion.div class={style.heroText} variants={textReveal}>
            <motion.span 
              class={style.heroTagline} 
              variants={textReveal}
              whileHover={{ scale: 1.05, color: "var(--accent-primary)" }}
            >
              🏥 Servicio de Salud Viña del Mar - Quillota
            </motion.span>
            <motion.h1 class={style.heroTitle} variants={textReveal}>
               Sistema de <span class={style.gradientText}>Gestión Vehicular</span> Inteligente
            </motion.h1>
            <motion.p class={style.heroSubtitle} variants={textReveal}>
              Plataforma de Nueva Generación
            </motion.p>
            <motion.p class={style.heroDescription} variants={textReveal}>
               Revoluciona la gestión de tu flota con inteligencia artificial, biometría avanzada 
               y automatización de última generación. Optimiza recursos, reduce costos y 
               maximiza la eficiencia operativa con la plataforma más avanzada del sector salud.
            </motion.p>
             
            <motion.div class={style.heroStats} variants={staggerContainer}>
              <motion.div class={style.heroStat} variants={slideUp}>
                <span class={style.statNumber}>24/7</span>
                <span class={style.statLabel}>Disponibilidad</span>
              </motion.div>
              <motion.div class={style.heroStat} variants={slideUp}>
                <span class={style.statNumber}>100%</span>
                <span class={style.statLabel}>Seguro</span>
              </motion.div>
              <motion.div class={style.heroStat} variants={slideUp}>
                <span class={style.statNumber}>IA</span>
                <span class={style.statLabel}>Inteligente</span>
              </motion.div>
            </motion.div>

             <motion.div class={style.heroButtons} variants={staggerContainer}>
              <motion.button
                class={style.ctaPrimary}
                variants={slideUp}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/asignaciones'}
              >
                 🚗 Solicitar Vehículo Ahora
               </motion.button>
              <motion.button
                class={style.ctaSecondary}
                variants={slideUp}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/camara'}
              >
                 📱 Acceso QR Rápido
               </motion.button>
             </motion.div>
          </motion.div>
          
          <motion.div class={style.heroImage} variants={imageFloat}>
            <div class={style.heroFachadaContainer}>
              <motion.img 
                src={fachadaSSVQ} 
                alt="Fachada Servicio de Salud Viña del Mar - Quillota" 
                class={style.heroFachada}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              />
              <div class={style.fachadaOverlay}>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section Mejorada */}
      <motion.section class={style.statsSection} variants={staggerContainer}>
        <motion.div class={style.statsHeader} variants={slideUp}>
          <h2>Panel de Control en Tiempo Real</h2>
          <p>Monitoreo continuo del estado operativo de la flota</p>
        </motion.div>
        <div class={style.statsGrid}>
          <motion.div 
            class={style.statCard}
            variants={cardHover}
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <div class={style.statIcon}>🚗</div>
            <div class={style.statNumber}>{isLoading ? '...' : resumen.v}</div>
            <div class={style.statLabel}>Vehículos Disponibles</div>
            <div class={style.statTrend}>En tiempo real</div>
          </motion.div>
          <motion.div 
            class={style.statCard}
            variants={cardHover}
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <div class={style.statIcon}>👨‍💼</div>
            <div class={style.statNumber}>{isLoading ? '...' : resumen.c}</div>
            <div class={style.statLabel}>Conductores Activos</div>
            <div class={style.statTrend}>Conectados ahora</div>
          </motion.div>
          <motion.div 
            class={style.statCard}
            variants={cardHover}
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <div class={style.statIcon}>📊</div>
            <div class={style.statNumber}>{isLoading ? '...' : resumen.a}</div>
            <div class={style.statLabel}>Asignaciones en Curso</div>
            <div class={style.statTrend}>Tiempo real</div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section Mejorada */}
      <motion.section class={style.featuresSection} variants={staggerContainer}>
        <motion.div class={style.sectionHeader} variants={slideUp}>
          <h2 class={style.sectionTitle}>Tecnología de Vanguardia</h2>
          <p class={style.sectionSubtitle}>
            Soluciones innovadoras que transforman la gestión vehicular en el sector salud
          </p>
        </motion.div>
        <div class={style.featuresGrid}>
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              class={style.featureCard}
              variants={slideUp}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div class={style.featureIconWrapper}>
                <motion.div 
                  class={style.featureIcon} 
                  style={{ background: feature.gradient }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <span>{feature.icon}</span>
                </motion.div>
              </div>
              <h3 class={style.featureTitle}>{feature.title}</h3>
              <p class={style.featureDescription}>{feature.description}</p>
              <motion.div 
                class={style.featureLearnMore}
                whileHover={{ x: 5 }}
              >
                Explorar funcionalidad →
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How it works Section Mejorada */}
      <motion.section class={style.howItWorksSection} variants={staggerContainer}>
        <motion.div class={style.sectionHeader} variants={slideUp}>
          <h2 class={style.sectionTitle}>Proceso Simplificado</h2>
          <p class={style.sectionSubtitle}>
            Cuatro pasos simples para acceder a la tecnología vehicular más avanzada
          </p>
        </motion.div>
        <div class={style.stepsContainer}>
          {steps.map((step) => (
            <motion.div
              key={step.id}
              class={style.stepCard}
              variants={slideUp}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                boxShadow: "0 20px 50px rgba(0,0,0,0.15)" 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div class={style.stepNumber}>{step.id}</div>
              <motion.div 
                class={style.stepIcon} 
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                {step.icon}
              </motion.div>
              <h4 class={style.stepTitle}>{step.detail}</h4>
              <p class={style.stepText}>{step.text}</p>
              <div class={style.stepProgress}>
                <div class={style.progressBar} style={{ width: `${(step.id / 4) * 100}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Nueva sección CTA mejorada */}
      <motion.section class={style.ctaSection} variants={staggerContainer}>
        <motion.div class={style.ctaContent} variants={slideUp}>
          <h2>Transforma la Gestión Vehicular de tu Organización</h2>
          <p>Únete al futuro de la administración inteligente de flotas en el sector salud</p>
          <div class={style.ctaButtons}>
            <motion.button
              class={style.ctaPrimary}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/asignaciones'}
            >
              🚀 Comenzar Ahora
            </motion.button>
            <motion.button
              class={style.ctaSecondary}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/mas-informacion'}
            >
              ❔ Más Información
            </motion.button>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer Mejorado */}
      <motion.footer
        class={style.footer}
        variants={slideUp}
      >
        <div class={style.footerContent}>
          <motion.div class={style.footerMainGrid} variants={staggerContainer}>
            {/* Columna Izquierda */}
            <motion.div class={style.footerLeftColumn} variants={slideUp}>
              <div class={style.footerLogos}>
                <motion.img 
                  src={logoSSVQ} 
                  alt="Logo SSVQ" 
                  class={style.footerLogo}
                  variants={slideUp}
                  whileHover={{ scale: 1.05 }}
                />
                <motion.img 
                  src={logoUV} 
                  alt="Logo Universidad de Valparaíso" 
                  class={style.footerLogo}
                  variants={slideUp}
                  whileHover={{ scale: 1.05 }}
                />
              </div>
              
              <div class={style.footerText}>
                <p>Escuela de Ingeniería Civil Biomédica UV</p>
                <p>Servicio de Salud Viña del Mar - Quillota</p>
                <p>&copy; 2025 Todos los derechos reservados</p>
              </div>
              
              <div class={style.footerContact}>
                <h4 class={style.contactTitle}>Soporte Técnico</h4>
                <a href="mailto:maximilianogaetepizza@gmail.com" class={style.contactEmail}>
                  maximilianogaetepizza@gmail.com
                </a>
              </div>
            </motion.div>

            {/* Columna Derecha */}
            <motion.div class={style.footerRightColumn} variants={slideUp}>
              <div class={style.footerTeam}>
                <h4 class={style.teamTitle}>Equipo de Desarrollo</h4>
                <div class={style.teamGrid}>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>Jorge Alcaino</span>
                  </motion.div>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>Alexis Arriola</span>
                  </motion.div>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>Luis Caneo</span>
                  </motion.div>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>Maximiliano Gaete</span>
                  </motion.div>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>Josefa Rebolledo</span>
                  </motion.div>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>María Ignacia Rojas</span>
                  </motion.div>
                  <motion.div class={style.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span class={style.memberName}>Andrés Vega</span>
                  </motion.div>
                </div>
              </div>
              
              <div class={style.footerLinks}>
                <motion.a href="/" variants={slideUp} whileHover={{ scale: 1.05 }}>Inicio</motion.a>
                <motion.a href="/asignaciones" variants={slideUp} whileHover={{ scale: 1.05 }}>Asignaciones</motion.a>
                <motion.a href="/vehiculos" variants={slideUp} whileHover={{ scale: 1.05 }}>Vehículos</motion.a>
                <motion.a href="/conductores" variants={slideUp} whileHover={{ scale: 1.05 }}>Conductores</motion.a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
