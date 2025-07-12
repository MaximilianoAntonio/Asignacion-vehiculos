import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { motion } from 'framer-motion';
import style from './style.css';
import homeStyle from '../home/style.css';

// Imágenes y assets
import logoSSVQ from '../../assets/logo-ssvq.jpg';
import logoUV from '../../assets/u-valparaiso.webp';
import fachadaSSVQ from '../../assets/ssvqfachada.png';

// Animaciones
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1 
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4 }
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 }
  }
};

// Animaciones del footer (importadas de home)
const slideUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const MasInformacionPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModule, setActiveModule] = useState(null);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [floatingNavCollapsed, setFloatingNavCollapsed] = useState(false);

  // Calcular progreso de lectura
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navegación mejorada entre secciones
  const navigationSections = [
    { id: 'overview', title: 'Vista General', icon: '📊', color: '#3B82F6' },
    { id: 'modules', title: 'Módulos', icon: '🧩', color: '#10B981' },
    { id: 'tutorials', title: 'Tutoriales', icon: '🎯', color: '#F59E0B' },
    { id: 'faq', title: 'FAQ', icon: '❓', color: '#8B5CF6' },
    { id: 'support', title: 'Soporte', icon: '🛠️', color: '#EF4444' }
  ];

  // Información completa de módulos
  const modulesInfo = [
    {
      id: 'home',
      title: '🏠 Panel Principal',
      icon: '🏠',
      color: '#4F46E5',
      description: 'Centro de control principal del sistema de asignación de vehículos',
      features: [
        {
          name: 'Dashboard Interactivo',
          description: 'Vista general con estadísticas en tiempo real de vehículos, conductores y asignaciones activas'
        },
        {
          name: 'Notificaciones del Sistema',
          description: 'Alertas importantes sobre mantenimientos pendientes, documentos vencidos y eventos críticos'
        },
        {
          name: 'Acceso Rápido',
          description: 'Enlaces directos a las funciones más utilizadas del sistema'
        },
        {
          name: 'Reportes Ejecutivos',
          description: 'Gráficos y métricas clave para la toma de decisiones gerenciales'
        }
      ],
      tutorials: [
        'Configuración inicial del sistema',
        'Interpretación del dashboard',
        'Gestión de notificaciones',
        'Generación de reportes básicos'
      ]
    },
    {
      id: 'assignments',
      title: '📋 Gestión de Asignaciones',
      icon: '📋',
      color: '#059669',
      description: 'Módulo completo para crear, modificar y monitorear asignaciones de vehículos',
      features: [
        {
          name: 'Crear Asignaciones',
          description: 'Asignar vehículos a conductores con fechas específicas y propósitos definidos'
        },
        {
          name: 'Validación Automática',
          description: 'Verificación de disponibilidad de vehículos, licencias vigentes y documentación'
        },
        {
          name: 'Historial Completo',
          description: 'Registro detallado de todas las asignaciones pasadas y presentes'
        },
        {
          name: 'Filtros Avanzados',
          description: 'Búsqueda por conductor, vehículo, fecha, estado y tipo de asignación'
        },
        {
          name: 'Exportación de Datos',
          description: 'Generación de reportes en PDF y Excel con información detallada'
        }
      ],
      tutorials: [
        'Crear una nueva asignación paso a paso',
        'Modificar asignaciones existentes',
        'Generar reportes de asignaciones',
        'Gestionar conflictos de horarios'
      ]
    },
    {
      id: 'vehicles',
      title: '🚗 Gestión de Vehículos',
      icon: '🚗',
      color: '#DC2626',
      description: 'Administración completa del parque vehicular de la organización',
      features: [
        {
          name: 'Registro de Vehículos',
          description: 'Información detallada: marca, modelo, año, placa, número de motor y documentación'
        },
        {
          name: 'Control de Documentos',
          description: 'Seguimiento de SOAT, revisión técnica, licencia de funcionamiento y permisos'
        },
        {
          name: 'Historial de Mantenimiento',
          description: 'Registro completo de servicios, reparaciones y cambio de repuestos'
        },
        {
          name: 'Alertas de Vencimiento',
          description: 'Notificaciones automáticas para renovación de documentos y mantenimientos'
        },
        {
          name: 'Galería de Imágenes',
          description: 'Fotos del vehículo, documentos y reportes de daños'
        }
      ],
      tutorials: [
        'Registrar un nuevo vehículo',
        'Actualizar documentación vehicular',
        'Programar mantenimientos',
        'Gestionar el historial del vehículo'
      ]
    },
    {
      id: 'drivers',
      title: '👨‍💼 Gestión de Conductores',
      icon: '👨‍💼',
      color: '#7C3AED',
      description: 'Administración integral de conductores y su documentación',
      features: [
        {
          name: 'Perfil de Conductor',
          description: 'Información personal, contacto, experiencia y calificaciones'
        },
        {
          name: 'Licencias de Conducir',
          description: 'Control de vigencia, categorías habilitadas y restricciones'
        },
        {
          name: 'Historial de Conducción',
          description: 'Registro de asignaciones, kilómetros recorridos y evaluaciones'
        },
        {
          name: 'Certificaciones',
          description: 'Cursos de manejo defensivo, primeros auxilios y capacitaciones'
        },
        {
          name: 'Evaluaciones',
          description: 'Sistema de calificación y retroalimentación del desempeño'
        }
      ],
      tutorials: [
        'Registrar un nuevo conductor',
        'Actualizar documentación',
        'Evaluar el desempeño',
        'Gestionar capacitaciones'
      ]
    },
    {
      id: 'camera',
      title: '📷 Lector QR',
      icon: '📷',
      color: '#EA580C',
      description: 'Sistema de identificación rápida mediante códigos QR',
      features: [
        {
          name: 'Escaneo Rápido',
          description: 'Identificación instantánea de vehículos y conductores mediante QR'
        },
        {
          name: 'Generación de Códigos',
          description: 'Creación automática de códigos QR para cada vehículo y conductor'
        },
        {
          name: 'Verificación de Estado',
          description: 'Validación inmediata de documentos y habilitaciones'
        },
        {
          name: 'Historial de Escaneos',
          description: 'Registro de todos los accesos y verificaciones realizadas'
        }
      ],
      tutorials: [
        'Usar el escáner QR',
        'Generar códigos QR',
        'Interpretar la información',
        'Solucionar problemas de escaneo'
      ]
    },
    {
      id: 'maintenance',
      title: '🔧 Control de Mantenimiento',
      icon: '🔧',
      color: '#0891B2',
      description: 'Sistema completo para gestionar el mantenimiento vehicular',
      features: [
        {
          name: 'Programación de Servicios',
          description: 'Calendario de mantenimientos preventivos y correctivos'
        },
        {
          name: 'Órdenes de Trabajo',
          description: 'Generación y seguimiento de órdenes de servicio detalladas'
        },
        {
          name: 'Control de Costos',
          description: 'Seguimiento de gastos en repuestos, mano de obra y servicios'
        },
        {
          name: 'Proveedores',
          description: 'Base de datos de talleres, proveedores y técnicos especializados'
        },
        {
          name: 'Inventario de Repuestos',
          description: 'Control de stock y gestión de repuestos frecuentes'
        }
      ],
      tutorials: [
        'Programar mantenimiento preventivo',
        'Crear órdenes de trabajo',
        'Gestionar proveedores',
        'Controlar costos de mantenimiento'
      ]
    }
  ];

  // Tutoriales completos del sistema
  const tutorialsData = [
    {
      category: 'Primeros Pasos',
      tutorials: [
        {
          title: 'Configuración Inicial del Sistema',
          duration: '15 min',
          difficulty: 'Básico',
          steps: [
            'Acceder al sistema con credenciales',
            'Configurar perfil de usuario',
            'Personalizar dashboard',
            'Configurar notificaciones',
            'Realizar primera asignación de prueba'
          ]
        },
        {
          title: 'Navegación y Interfaz',
          duration: '10 min',
          difficulty: 'Básico',
          steps: [
            'Conocer el menú principal',
            'Usar filtros y búsquedas',
            'Interpretar iconos y códigos de color',
            'Acceder a ayuda contextual'
          ]
        }
      ]
    },
    {
      category: 'Gestión Operativa',
      tutorials: [
        {
          title: 'Proceso Completo de Asignación',
          duration: '20 min',
          difficulty: 'Intermedio',
          steps: [
            'Verificar disponibilidad de vehículo',
            'Validar habilitación del conductor',
            'Crear nueva asignación',
            'Configurar alertas de devolución',
            'Generar documentación'
          ]
        },
        {
          title: 'Gestión de Documentos Vehiculares',
          duration: '25 min',
          difficulty: 'Intermedio',
          steps: [
            'Cargar documentos al sistema',
            'Configurar alertas de vencimiento',
            'Renovar documentación',
            'Generar reportes de cumplimiento'
          ]
        }
      ]
    },
    {
      category: 'Administración Avanzada',
      tutorials: [
        {
          title: 'Reportes y Análisis',
          duration: '30 min',
          difficulty: 'Avanzado',
          steps: [
            'Configurar reportes personalizados',
            'Analizar métricas de utilización',
            'Generar reportes ejecutivos',
            'Exportar datos para análisis externo'
          ]
        },
        {
          title: 'Optimización del Sistema',
          duration: '35 min',
          difficulty: 'Avanzado',
          steps: [
            'Configurar flujos de trabajo',
            'Personalizar notificaciones',
            'Integrar con sistemas externos',
            'Mantener la base de datos'
          ]
        }
      ]
    }
  ];

  // Preguntas frecuentes
  const faqData = [
    {
      category: 'Uso General',
      questions: [
        {
          question: '¿Cómo puedo restablecer mi contraseña?',
          answer: 'Contacte al administrador del sistema o use la opción "Olvidé mi contraseña" en la pantalla de login.'
        },
        {
          question: '¿Puedo usar el sistema desde mi teléfono móvil?',
          answer: 'Sí, el sistema es completamente responsive y funciona perfectamente en dispositivos móviles.'
        },
        {
          question: '¿Cómo puedo exportar los reportes?',
          answer: 'Cada módulo tiene opciones de exportación en PDF y Excel. Busque el botón "Exportar" en la parte superior derecha.'
        }
      ]
    },
    {
      category: 'Asignaciones',
      questions: [
        {
          question: '¿Qué hago si un vehículo no está disponible?',
          answer: 'El sistema mostrará vehículos alternativos. También puede programar la asignación para cuando el vehículo esté disponible.'
        },
        {
          question: '¿Puedo modificar una asignación activa?',
          answer: 'Sí, pero dependiendo del tipo de cambio, puede requerir autorización del supervisor.'
        },
        {
          question: '¿Cómo cancelo una asignación?',
          answer: 'Use el botón "Cancelar" en el detalle de la asignación. Esto liberará automáticamente el vehículo.'
        }
      ]
    },
    {
      category: 'Mantenimiento',
      questions: [
        {
          question: '¿Cómo programo un mantenimiento preventivo?',
          answer: 'Vaya al módulo de Mantenimiento, seleccione el vehículo y use "Programar Servicio".'
        },
        {
          question: '¿El sistema me avisa sobre vencimientos?',
          answer: 'Sí, recibirá notificaciones automáticas 30, 15 y 5 días antes del vencimiento.'
        }
      ]
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  // Función de búsqueda mejorada
  const filterContent = (content, searchTerm) => {
    if (!searchTerm) return content;
    return content.filter(item => 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.features?.some(feature => 
        feature.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Función para resaltar texto de búsqueda
  const highlightSearchTerm = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Generar tabla de contenidos automática
  const generateTableOfContents = () => {
    const toc = [
      { id: 'overview', title: 'Vista General del Sistema', level: 1 },
      { id: 'modules', title: 'Módulos del Sistema', level: 1 },
      ...modulesInfo.map(module => ({
        id: `module-${module.id}`,
        title: module.title,
        level: 2,
        features: module.features.map(feature => ({
          id: `${module.id}-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          title: feature.name,
          level: 3
        }))
      })),
      { id: 'tutorials', title: 'Tutoriales Completos', level: 1 },
      { id: 'faq', title: 'Preguntas Frecuentes', level: 1 },
      { id: 'support', title: 'Soporte y Contacto', level: 1 }
    ];
    return toc;
  };

  return (
    <motion.div 
      className={style.masInformacionPage}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Hero */}
      <motion.section className={style.heroSection} variants={sectionVariants}>
        <div className={style.heroContent}>
          <div className={style.heroGrid}>
            <div className={style.heroMain}>
              <h1 className={style.heroTitle}>
                Guía Completa del Sistema de Gestión Vehicular
              </h1>
              <p className={style.heroSubtitle}>
                Todo lo que necesitas saber para usar eficientemente nuestra plataforma de vanguardia. 
                Documentación completa, tutoriales paso a paso y soporte técnico especializado.
              </p>
              
              <div className={style.heroStats}>
                <div className={style.heroStat}>
                  <span className={style.statNumber}>6</span>
                  <span className={style.statLabel}>Módulos</span>
                </div>
                <div className={style.heroStat}>
                  <span className={style.statNumber}>25+</span>
                  <span className={style.statLabel}>Funcionalidades</span>
                </div>
                <div className={style.heroStat}>
                  <span className={style.statNumber}>100%</span>
                  <span className={style.statLabel}>Documentado</span>
                </div>
              </div>

              <div className={style.heroFeatures}>
                <div className={style.feature}>
                  <span className={style.featureIcon}>🚀</span>
                  <span className={style.featureText}>Tecnología Moderna</span>
                </div>
                <div className={style.feature}>
                  <span className={style.featureIcon}>🛡️</span>
                  <span className={style.featureText}>Sistema Seguro</span>
                </div>
                <div className={style.feature}>
                  <span className={style.featureIcon}>📱</span>
                  <span className={style.featureText}>Interfaz Intuitiva</span>
                </div>
              </div>
            </div>

            <div className={style.heroLogos}>
              <div className={style.logoRow}>
                <div className={style.logoContainer}>
                  <img src={logoSSVQ} alt="SSVQ" className={style.heroLogo} />
                  <span className={style.logoLabel}>Servicio de Salud Viña de Mar - Quillota</span>
                </div>
              </div>
              <div className={style.logoSeparator}>
                <span className={style.separatorText}>EN COLABORACIÓN CON</span>
              </div>
              <div className={style.logoRow}>
                <div className={style.logoContainer}>
                  <img src={logoUV} alt="Universidad de Valparaíso" className={style.heroLogo} />
                  <span className={style.logoLabel}>Escuela de Ingeniería Civil Biomédica UV</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Barra de progreso de lectura */}
      <div className={style.progressBar}>
        <div 
          className={style.progressFill} 
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Panel de navegación flotante */}
      <motion.div 
        className={`${style.floatingNavPanel} ${floatingNavCollapsed ? style.collapsed : ''}`}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Botón de colapsar/expandir */}
        <button
          onClick={() => setFloatingNavCollapsed(!floatingNavCollapsed)}
          className={style.floatingNavToggle}
          title={floatingNavCollapsed ? 'Expandir navegación' : 'Colapsar navegación'}
        >
          {floatingNavCollapsed ? '📂' : '📁'}
        </button>

        {/* Contenido del panel cuando está expandido */}
        {!floatingNavCollapsed && (
          <motion.div 
            className={style.floatingNavContent}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={style.navControls}>
              {/* Barra de búsqueda */}
              <div className={style.searchContainer}>
                <input
                  type="text"
                  placeholder="Buscar en la documentación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={style.searchInput}
                />
                <span className={style.searchIcon}>🔍</span>
              </div>

              {/* Filtro por módulo */}
              <select
                value={activeModule}
                onChange={(e) => setActiveModule(e.target.value)}
                className={style.moduleFilter}
              >
                <option value="all">Todos los módulos</option>
                {modulesInfo.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>

              {/* Toggle tabla de contenidos */}
              <button
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className={`${style.tocToggle} ${showTableOfContents ? style.active : ''}`}
              >
                {showTableOfContents ? '📋 Ocultar Índice' : '📋 Mostrar Índice'}
              </button>
            </div>

            {/* Navegación rápida por secciones */}
            <div className={style.quickNavButtons}>
              {navigationSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`${style.navButton} ${activeSection === section.id ? style.active : ''}`}
                  style={{ borderColor: section.color }}
                >
                  <span className={style.navIcon}>{section.icon}</span>
                  <span className={style.navText}>{section.title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Vista compacta cuando está colapsado */}
        {floatingNavCollapsed && (
          <motion.div 
            className={style.compactNav}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`${style.compactNavButton} ${activeSection === section.id ? style.active : ''}`}
                style={{ borderColor: section.color }}
                title={section.title}
              >
                <span className={style.navIcon}>{section.icon}</span>
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Tabla de contenidos lateral */}
      {showTableOfContents && (
        <motion.div 
          className={style.tableOfContents}
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.3 }}
        >
          <div className={style.tocHeader}>
            <h3>📋 Tabla de Contenidos</h3>
            <button 
              onClick={() => setShowTableOfContents(false)}
              className={style.tocClose}
            >
              ✕
            </button>
          </div>
          <div className={style.tocContent}>
            {generateTableOfContents().map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`${style.tocItem} ${style[`level${item.level}`]} ${activeSection === item.id ? style.active : ''}`}
                >
                  {item.title}
                </button>
                {item.features && item.features.map((feature, featureIndex) => (
                  <button
                    key={featureIndex}
                    onClick={() => scrollToSection(feature.id)}
                    className={`${style.tocItem} ${style.level3}`}
                  >
                    {feature.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Vista General del Sistema */}
      <motion.section id="overview" className={style.overviewSection} variants={sectionVariants}>
        <h2 className={style.sectionTitle}>Vista General del Sistema</h2>
        <div className={style.overviewGrid}>
          <motion.div className={style.overviewCard} variants={cardVariants} whileHover="hover">
            <h3>🎯 Objetivo Principal</h3>
            <p>
              Optimizar la gestión vehicular del Servicio de Salud Viña del Mar - Quillota 
              mediante tecnología de vanguardia, automatización inteligente y control biométrico.
            </p>
          </motion.div>
          <motion.div className={style.overviewCard} variants={cardVariants} whileHover="hover">
            <h3>🔧 Tecnologías Utilizadas</h3>
            <ul>
              <li>Preact + JavaScript para interfaz responsiva</li>
              <li>Python + Django para backend robusto</li>
              <li>SQLite para almacenamiento eficiente</li>
              <li>Leaflet para mapas interactivos</li>
              <li>jsPDF para generación de reportes</li>
              <li>jsQR para lectura de códigos QR</li>
            </ul>
          </motion.div>
          <motion.div className={style.overviewCard} variants={cardVariants} whileHover="hover">
            <h3>👥 Usuarios del Sistema</h3>
            <ul>
              <li><strong>Solicitantes:</strong> Personal que requiere vehículos</li>
              <li><strong>Conductores:</strong> Operadores de la flota</li>
              <li><strong>Administradores:</strong> Gestores del sistema</li>
              <li><strong>Supervisores:</strong> Control y reportes</li>
            </ul>
          </motion.div>
          <motion.div className={style.overviewCard} variants={cardVariants} whileHover="hover">
            <h3>🔐 Seguridad y Acceso</h3>
            <p>
              Sistema de autenticación multi-nivel con control biométrico QR, 
              encriptación de datos sensibles y auditoría completa de operaciones.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Módulos Detallados */}
      <motion.section id="modules" className={style.modulesSection} variants={sectionVariants}>
        <h2 className={style.sectionTitle}>🧩 Módulos del Sistema</h2>
        <p className={style.sectionSubtitle}>
          Exploración detallada de cada funcionalidad con tutoriales paso a paso
        </p>
        
        {/* Mostrar resultados de búsqueda si hay filtro activo */}
        {searchTerm && (
          <div className={style.searchResults}>
            <p>🔍 Mostrando resultados para: <strong>"{searchTerm}"</strong></p>
          </div>
        )}
        
        <div className={style.modulesGrid}>
          {filterContent(modulesInfo, searchTerm)
            .filter(module => activeModule === 'all' || module.id === activeModule)
            .map((module, index) => (
            <motion.div 
              key={module.id}
              className={style.moduleCard}
              variants={cardVariants}
              whileHover="hover"
              style={{ '--module-color': module.color }}
              layout
            >
              <div className={style.moduleHeader}>
                <span className={style.moduleIcon}>{module.icon}</span>
                <h3 className={style.moduleTitle}>
                  <span dangerouslySetInnerHTML={{ 
                    __html: highlightSearchTerm(module.title, searchTerm) 
                  }} />
                </h3>
                <p className={style.moduleDescription}>
                  <span dangerouslySetInnerHTML={{ 
                    __html: highlightSearchTerm(module.description, searchTerm) 
                  }} />
                </p>
              </div>
              
              <div className={style.moduleFeatures}>
                <h4 className={style.featuresTitle}>✨ Características Principales</h4>
                {module.features.map((feature, featureIndex) => (
                  <motion.div 
                    key={featureIndex}
                    id={`${module.id}-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={style.featureCard}
                    variants={cardVariants}
                  >
                    <h5 className={style.featureName}>
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(feature.name, searchTerm) 
                      }} />
                    </h5>
                    <p className={style.featureDescription}>
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(feature.description, searchTerm) 
                      }} />
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className={style.moduleTutorials}>
                <h4 className={style.tutorialsTitle}>🎯 Tutoriales Disponibles</h4>
                <ul className={style.tutorialsList}>
                  {module.tutorials.map((tutorial, tutorialIndex) => (
                    <li key={tutorialIndex} className={style.tutorialItem}>
                      <span className={style.tutorialIcon}>📖</span>
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(tutorial, searchTerm) 
                      }} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className={style.moduleActions}>
                <button 
                  className={style.moduleActionBtn}
                  onClick={() => scrollToSection('tutorials')}
                >
                  Ver Tutoriales Completos →
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mensaje si no hay resultados */}
        {filterContent(modulesInfo, searchTerm)
          .filter(module => activeModule === 'all' || module.id === activeModule)
          .length === 0 && (
          <div className={style.noResults}>
            <h3>🔍 Sin resultados</h3>
            <p>No se encontraron módulos que coincidan con tu búsqueda.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setActiveModule('all');
              }}
              className={style.clearFiltersBtn}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </motion.section>

      {/* Tutoriales Completos */}
      <motion.section id="tutorials" className={style.tutorialsSection} variants={sectionVariants}>
        <h2 className={style.sectionTitle}>Tutoriales Completos</h2>
        <p className={style.sectionSubtitle}>
          Guías detalladas para dominar los procesos más importantes del sistema
        </p>
        
        <div className={style.tutorialCategories}>
          {tutorialsData.map((category, categoryIndex) => (
            <motion.div 
              key={categoryIndex}
              className={style.tutorialCategory}
              variants={cardVariants}
              whileHover="hover"
            >
              <h3 className={style.categoryTitle}>
                <span className={style.categoryIcon}>
                  {categoryIndex === 0 ? '🚀' : categoryIndex === 1 ? '⚙️' : '🎓'}
                </span>
                {category.category}
              </h3>
              
              <div className={style.categoryTutorials}>
                {category.tutorials.map((tutorial, tutorialIndex) => (
                  <motion.div 
                    key={tutorialIndex}
                    className={style.tutorialCard}
                    variants={cardVariants}
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className={style.tutorialHeader}>
                      <h4 className={style.tutorialTitle}>{tutorial.title}</h4>
                      <div className={style.tutorialMeta}>
                        <span className={`${style.tutorialDifficulty} ${style[tutorial.difficulty.toLowerCase()]}`}>
                          {tutorial.difficulty}
                        </span>
                        <span className={style.tutorialDuration}>
                          ⏱️ {tutorial.duration}
                        </span>
                      </div>
                    </div>
                    
                    <div className={style.tutorialSteps}>
                      <h5 className={style.stepsTitle}>📋 Pasos a seguir:</h5>
                      <ol className={style.stepsList}>
                        {tutorial.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className={style.tutorialStep}>
                            <span className={style.stepNumber}>{stepIndex + 1}</span>
                            <span className={style.stepText}>
                              <span dangerouslySetInnerHTML={{ 
                                __html: highlightSearchTerm(step, searchTerm) 
                              }} />
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className={style.tutorialActions}>
                      <button className={style.tutorialActionBtn}>
                        🎮 Iniciar Tutorial
                      </button>
                      <button className={style.tutorialActionBtn + ' ' + style.secondary}>
                        📥 Descargar PDF
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Preguntas Frecuentes */}
      <motion.section id="faq" className={style.faqSection} variants={sectionVariants}>
        <h2 className={style.sectionTitle}>❓ Preguntas Frecuentes</h2>
        <p className={style.sectionSubtitle}>
          Respuestas a las consultas más comunes sobre el uso del sistema
        </p>
        
        <div className={style.faqGrid}>
          {faqData.map((section, index) => (
            <motion.div 
              key={index}
              className={style.faqCategory}
              variants={cardVariants}
              whileHover="hover"
            >
              <h3 className={style.faqCategoryTitle}>
                <span className={style.faqCategoryIcon}>
                  {index === 0 ? '🎯' : index === 1 ? '📋' : '🔧'}
                </span>
                {section.category}
              </h3>
              
              <div className={style.faqQuestions}>
                {section.questions.map((faq, faqIndex) => (
                  <motion.div 
                    key={faqIndex}
                    className={style.faqItem}
                    variants={cardVariants}
                    whileHover={{ backgroundColor: '#f8fafc' }}
                  >
                    <h4 className={style.faqQuestion}>
                      <span className={style.questionIcon}>❓</span>
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(faq.question, searchTerm) 
                      }} />
                    </h4>
                    <p className={style.faqAnswer}>
                      <span className={style.answerIcon}>💡</span>
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(faq.answer, searchTerm) 
                      }} />
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contacto y Soporte */}
      <motion.section id="support" className={style.supportSection} variants={sectionVariants}>
        <h2 className={style.sectionTitle}>Soporte y Contacto</h2>
        <div className={style.supportGrid}>
          <motion.div className={style.supportCard} variants={cardVariants} whileHover="hover">
            <h3>🛠️ Soporte Técnico</h3>
            <p>Para problemas técnicos o errores del sistema:</p>
            <ul>
              <li>Email: maximilianogaetepizza@gmail.com</li>
              <li>Teléfono: +56 9 3670 3492</li>
              <li>Horario: Lunes a Viernes, 8:00 - 17:00</li>
            </ul>
          </motion.div>
          
          <motion.div className={style.supportCard} variants={cardVariants} whileHover="hover">
            <h3>📚 Capacitación</h3>
            <p>Para solicitar capacitación adicional:</p>
            <ul>
              <li>Sesiones grupales disponibles</li>
              <li>Capacitación personalizada</li>
              <li>Material de apoyo descargable</li>
            </ul>
          </motion.div>
          
          <motion.div className={style.supportCard} variants={cardVariants} whileHover="hover">
            <h3>💡 Sugerencias</h3>
            <p>Para mejoras y nuevas funcionalidades:</p>
            <ul>
              <li>Portal de sugerencias online</li>
              <li>Reuniones de retroalimentación</li>
              <li>Participación en desarrollo futuro</li>
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer Mejorado */}
      <motion.footer
        className={homeStyle.footer}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={homeStyle.footerContent}>
          <motion.div 
            className={homeStyle.footerMainGrid} 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Columna Izquierda */}
            <motion.div className={homeStyle.footerLeftColumn} variants={slideUp}>
              <div className={homeStyle.footerLogos}>
                <motion.img 
                  src={logoSSVQ} 
                  alt="Logo SSVQ" 
                  className={homeStyle.footerLogo}
                  variants={slideUp}
                  whileHover={{ scale: 1.05 }}
                />
                <motion.img 
                  src={logoUV} 
                  alt="Logo Universidad de Valparaíso" 
                  className={homeStyle.footerLogo}
                  variants={slideUp}
                  whileHover={{ scale: 1.05 }}
                />
              </div>
              
              <div className={homeStyle.footerText}>
                <p>Escuela de Ingeniería Civil Biomédica UV</p>
                <p>Servicio de Salud Viña del Mar - Quillota</p>
                <p>&copy; 2025 Todos los derechos reservados</p>
              </div>
              
              <div className={homeStyle.footerContact}>
                <h4 className={homeStyle.contactTitle}>Soporte Técnico</h4>
                <a href="mailto:maximilianogaetepizza@gmail.com" className={homeStyle.contactEmail}>
                  maximilianogaetepizza@gmail.com
                </a>
              </div>
            </motion.div>

            {/* Columna Derecha */}
            <motion.div className={homeStyle.footerRightColumn} variants={slideUp}>
              <div className={homeStyle.footerTeam}>
                <h4 className={homeStyle.teamTitle}>Equipo de Desarrollo</h4>
                <div className={homeStyle.teamGrid}>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>Jorge Alcaino</span>
                  </motion.div>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>Alexis Arriola</span>
                  </motion.div>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>Luis Caneo</span>
                  </motion.div>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>Maximiliano Gaete</span>
                  </motion.div>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>Josefa Rebolledo</span>
                  </motion.div>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>María Ignacia Rojas</span>
                  </motion.div>
                  <motion.div className={homeStyle.teamMember} variants={slideUp} whileHover={{ scale: 1.05, y: -5 }}>
                    <span className={homeStyle.memberName}>Andrés Vega</span>
                  </motion.div>
                </div>
              </div>
              
              <div className={homeStyle.footerLinks}>
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
};

export default MasInformacionPage;
