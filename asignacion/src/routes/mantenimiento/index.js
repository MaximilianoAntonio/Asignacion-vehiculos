import { h } from 'preact';
import style from './style.css';

const MantenimientoPage = () => {
    return (
        <div class={style.mantenimientoPage}>
            <h1>Dashboard de Mantenimiento</h1>
            
            <div class={style.powerbiContainer}>
                {/* 
                  INSTRUCCIONES:
                  1. Ve a tu informe en Power BI.
                  2. Haz clic en "Archivo" > "Insertar informe" > "Publicar en la web (público)".
                  3. Copia el código del <iframe> que te proporciona Power BI.
                  4. Pega ese código aquí debajo, reemplazando este comentario.
                */}
                <p class={style.placeholderText}>
                {/* 
                    Aquí va tu dashboard de Power BI. Pega el código <iframe> de Power BI para mostrarlo. 
                */}
                </p>
            </div>
        </div>
    );
};

export default MantenimientoPage;
