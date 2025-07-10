import { h } from 'preact';
import { route } from 'preact-router';
import { motion } from 'framer-motion';
import style from './style.css';

const NotFoundPage = () => (
    <motion.div 
        class={style.notFoundContainer}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
    >
        <div class={`card ${style.notFoundCard}`}>
            <div class={style.errorCode}>404</div>
            <h1 class={style.title}>Página No Encontrada</h1>
            <p class={style.message}>
                Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
            <button class="btn btn-primary" onClick={() => route('/', true)}>
                Volver al Inicio
            </button>
        </div>
    </motion.div>
);

export default NotFoundPage;
