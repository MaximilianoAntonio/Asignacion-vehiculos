import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { motion } from 'framer-motion';
import style from './style.css';
import jsQR from 'jsqr';
import { getConductores, iniciarTurno, finalizarTurno } from '../../services/conductorService';

// Función para extraer RUN de URL del Registro Civil
const extractRunFromUrl = (url) => {
    try {
        // Buscar patrón RUN= en la URL
        const runMatch = url.match(/RUN=([^&]+)/);
        if (runMatch && runMatch[1]) {
            return runMatch[1].trim();
        }
        return null;
    } catch (error) {
        console.error('Error al extraer RUN de URL:', error);
        return null;
    }
};

// Función para validar si el texto escaneado es un RUN válido
const isValidRun = (text) => {
    // Formato RUN chileno: 12345678-9
    const runPattern = /^\d{7,8}-[\dkK]$/;
    return runPattern.test(text);
};

const CamaraPage = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scanLockRef = useRef(false); // NUEVO: referencia para bloquear escaneo inmediato
    const [error, setError] = useState(null);
    const [qrResult, setQrResult] = useState('');
    const [conductores, setConductores] = useState([]);
    const [registroMsg, setRegistroMsg] = useState('');
    const [registroTipo, setRegistroTipo] = useState(''); // 'success' | 'error'
    const [registroEnCurso, setRegistroEnCurso] = useState(false);

    // Cargar lista de conductores al montar y cuando la pestaña se vuelve visible
    useEffect(() => {
        const cargarConductores = () => {
            getConductores()
                .then(setConductores)
                .catch(() => setError('No se pudo cargar la lista de conductores.'));
        };
        cargarConductores();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                cargarConductores();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // Cámara y escaneo QR
    useEffect(() => {
        let stream;
        let animationId;
        let isMounted = true;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(s => {
                stream = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        scan();
                    };
                }
            })
            .catch(err => setError(`No se pudo acceder a la cámara: ${  err.message}`));

        function scan() {
            if (!isMounted || registroEnCurso || scanLockRef.current) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (
                video &&
                canvas &&
                video.readyState === 4 &&
                video.videoWidth > 0 &&
                video.videoHeight > 0
            ) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code && code.data) {
                    if (!scanLockRef.current && qrResult === '') {
                        scanLockRef.current = true; // BLOQUEA inmediatamente
                        setQrResult(code.data);
                        setRegistroEnCurso(true);
                        handleQR(code.data);
                    }
                } else if (qrResult !== '') {
                        setTimeout(() => {
                            setQrResult('');
                            setRegistroEnCurso(false);
                            scanLockRef.current = false; // DESBLOQUEA para nuevo escaneo
                        }, 300);
                    }
            }
            animationId = requestAnimationFrame(scan);
        }

        return () => {
            isMounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
        // eslint-disable-next-line
    }, [conductores, qrResult, registroEnCurso]);

    // Marca entrada solo si está en dia_libre o no_disponible, salida solo si está disponible
    const handleQR = async (qrData) => {
        if (!qrData || conductores.length === 0) return;
        
        let run = null;
        
        // Verificar si es una URL del Registro Civil
        if (qrData.includes('portal.sidiv.registrocivil.cl')) {
            run = extractRunFromUrl(qrData);
        } 
        // Verificar si es directamente un RUN válido
        else if (isValidRun(qrData.trim())) {
            run = qrData.trim();
        }
        // Si no es ninguno de los casos anteriores, intentar buscar por nombre (compatibilidad)
        else {
            const qrNombre = qrData.trim().toLowerCase();
            const conductorPorNombre = conductores.find(
                c => (`${c.nombre} ${c.apellido}`).trim().toLowerCase() === qrNombre
            );
            if (conductorPorNombre) {
                run = conductorPorNombre.run;
            }
        }

        if (!run) {
            setRegistroTipo('error');
            setRegistroMsg('No se pudo extraer RUN del código QR o no es válido.');
            setTimeout(() => {
                setRegistroMsg('');
                setRegistroTipo('');
                setRegistroEnCurso(false);
                setQrResult('');
                scanLockRef.current = false;
            }, 2500);
            return;
        }

        // Buscar conductor por RUN
        const conductor = conductores.find(c => c.run === run);
        
        if (!conductor) {
            setRegistroTipo('error');
            setRegistroMsg(`Conductor con RUN ${run} no encontrado.`);
            setTimeout(() => {
                setRegistroMsg('');
                setRegistroTipo('');
                setRegistroEnCurso(false);
                setQrResult('');
                scanLockRef.current = false;
            }, 2500);
            return;
        }
        try {
            let resp;
            let nuevoEstado = conductor.estado_disponibilidad;
            if (conductor.estado_disponibilidad === 'dia_libre') {
                resp = await iniciarTurno(conductor.id);
                if (resp && resp.data && resp.status >= 200 && resp.status < 300) {
                    setRegistroTipo('success');
                    setRegistroMsg(`Entrada registrada para ${conductor.nombre} ${conductor.apellido} (RUN: ${run})`);
                    nuevoEstado = 'disponible';
                } else {
                    setRegistroTipo('error');
                    setRegistroMsg('No se pudo registrar la entrada.');
                }
            } else if (conductor.estado_disponibilidad === 'disponible') {
                resp = await finalizarTurno(conductor.id);
                if (resp && resp.data && resp.status >= 200 && resp.status < 300) {
                    setRegistroTipo('success');
                    setRegistroMsg(`Salida registrada para ${conductor.nombre} ${conductor.apellido} (RUN: ${run})`);
                    nuevoEstado = 'dia_libre';
                } else {
                    setRegistroTipo('error');
                    setRegistroMsg('No se pudo registrar la salida.');
                }
            } else {
                setRegistroTipo('error');
                setRegistroMsg(`No se puede registrar turno para ${conductor.nombre} ${conductor.apellido} (RUN: ${run}, estado: ${conductor.estado_disponibilidad})`);
            }
            setConductores(prev =>
                prev.map(c =>
                    c.id === conductor.id
                        ? { ...c, estado_disponibilidad: nuevoEstado }
                        : c
                )
            );
            const actualizados = await getConductores();
            setConductores(actualizados);
        } catch (e) {
            setRegistroTipo('error');
            let msg = 'Error al registrar turno.';
            if (e && e.response && e.response.data) {
                if (typeof e.response.data === 'string') {
                    msg = e.response.data;
                } else if (typeof e.response.data === 'object') {
                    msg = Object.values(e.response.data).join(' ');
                }
            }
            setRegistroMsg(msg);
        }
        setTimeout(() => {
            setRegistroMsg('');
            setRegistroTipo('');
            setRegistroEnCurso(false);
            setQrResult('');
            scanLockRef.current = false; // DESBLOQUEA para nuevo escaneo
        }, 3500);
    };

    return (
        <motion.div 
            class={style.camaraContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div class={`page-header ${style.pageHeader}`}>
                <h1 class="page-title">Control de Acceso QR</h1>
                <p class="page-subtitle">Apunta la cámara al código QR para registrar la entrada o salida del conductor.</p>
            </div>
            
            <div class={style.camaraInstructions}>
                <p><strong>Códigos Aceptados:</strong> Cédula de identidad (QR), RUN directo (e.g., 12345678-9), o nombre completo.</p>
            </div>
            
            {error && <div class={`status-message error`}>{error}</div>}
            
            <div class={`card ${style.camaraCard}`}>
                <div class={style.videoWrapper}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        class={style.camaraVideo}
                        style={registroEnCurso ? { filter: 'grayscale(1)', opacity: 0.5 } : {}}
                    />
                    <div class={style.scanOverlay} />
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div class={style.qrResult}>
                    <h4>Código Detectado:</h4>
                    <div class={`${style.qrData} ${qrResult ? style.detected : ''}`}>
                        {qrResult ? (
                            <div>
                                <div style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginBottom: '8px' }}>Código escaneado:</div>
                                <div style={{ marginBottom: '8px', fontSize: '0.8em', wordBreak: 'break-all' }}>{qrResult}</div>
                                {qrResult.includes('portal.sidiv.registrocivil.cl') && (
                                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                                        RUN detectado: {extractRunFromUrl(qrResult)}
                                    </div>
                                )}
                                {isValidRun(qrResult.trim()) && (
                                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: 'var(--accent-success)' }}>
                                        RUN: {qrResult.trim()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            'Esperando código QR...'
                        )}
                    </div>
                </div>
            </div>
            
            {registroMsg && (
                <div class={`status-message ${style[registroTipo]}`}>
                    {registroMsg}
                </div>
            )}
        </motion.div>
    );
};

export default CamaraPage;

