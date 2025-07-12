import { h } from 'preact';
import { motion } from 'framer-motion';
import style from './style.css';

const MantenimientoPage = () => {
    return (
        <motion.div 
            class={style.mantenimientoPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div class="page-header">
                <h1 class="page-title">Dashboard de Mantenimiento</h1>
                <p class="page-subtitle">Visualización de datos de mantenimiento a través de Power BI.</p>
            </div>
            
            <div class={`card ${style.powerbiContainer}`}>
                {/* 
                  INSTRUCCIONES:
                  1. Ve a tu informe en Power BI.
                  2. Haz clic en "Archivo" > "Insertar informe" > "Publicar en la web (público)".
                  3. Copia el código del <iframe> que te proporciona Power BI.
                  4. Pega ese código aquí debajo, reemplazando este comentario.
                */}
                <div class={style.placeholderContent}>
                    <i class="icon-powerbi" />
                    <h3>Dashboard de Power BI</h3>
                    <p>
                        Aquí se mostrará el dashboard interactivo. Pega el código <strong>&lt;iframe&gt;</strong> proporcionado por Power BI para activarlo.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default MantenimientoPage;
