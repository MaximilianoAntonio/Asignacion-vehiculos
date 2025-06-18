import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import style from './style.css';
import jsQR from 'jsqr';
import { getConductores, iniciarTurno, finalizarTurno } from '../../services/conductorService';

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
            .catch(err => setError('No se pudo acceder a la cámara: ' + err.message));

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
                } else {
                    if (qrResult !== '') {
                        setTimeout(() => {
                            setQrResult('');
                            setRegistroEnCurso(false);
                            scanLockRef.current = false; // DESBLOQUEA para nuevo escaneo
                        }, 300);
                    }
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
        const qrNombre = qrData.trim().toLowerCase();
        const conductor = conductores.find(
            c => (`${c.nombre} ${c.apellido}`).trim().toLowerCase() === qrNombre
        );
        if (!conductor) {
            setRegistroTipo('error');
            setRegistroMsg('Conductor no encontrado.');
            setTimeout(() => {
                setRegistroMsg('');
                setRegistroTipo('');
                setRegistroEnCurso(false);
                setQrResult('');
                scanLockRef.current = false; // DESBLOQUEA para nuevo escaneo
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
                    setRegistroMsg(`Entrada registrada para ${conductor.nombre} ${conductor.apellido}`);
                    nuevoEstado = 'disponible';
                } else {
                    setRegistroTipo('error');
                    setRegistroMsg('No se pudo registrar la entrada.');
                }
            } else if (conductor.estado_disponibilidad === 'disponible') {
                resp = await finalizarTurno(conductor.id);
                if (resp && resp.data && resp.status >= 200 && resp.status < 300) {
                    setRegistroTipo('success');
                    setRegistroMsg(`Salida registrada para ${conductor.nombre} ${conductor.apellido}`);
                    nuevoEstado = 'dia_libre';
                } else {
                    setRegistroTipo('error');
                    setRegistroMsg('No se pudo registrar la salida.');
                }
            } else {
                setRegistroTipo('error');
                setRegistroMsg(`No se puede registrar turno para ${conductor.nombre} ${conductor.apellido} (estado: ${conductor.estado_disponibilidad})`);
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
        <div class={style.camaraContainer}>
            <h1 class={style.camaraTitle}>Vista de Cámara</h1>
            {error && <p class={style.camaraError}>{error}</p>}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                class={style.camaraVideo}
                style={registroEnCurso ? { filter: 'grayscale(1)', opacity: 0.5 } : {}}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <b>Resultado QR:</b>
                <div style={{ marginTop: 8, wordBreak: 'break-all', color: qrResult ? '#2563EB' : '#888' }}>
                    {qrResult || 'No detectado'}
                </div>
            </div>
            {registroMsg && (
                <div
                    style={{
                        marginTop: 24,
                        background: registroTipo === 'success' ? '#16a34a' : '#dc2626',
                        color: '#fff',
                        padding: '16px 24px',
                        borderRadius: 8,
                        fontWeight: 'bold',
                        fontSize: '1.2em',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s',
                        animation: 'fadeInScale 0.5s'
                    }}
                >
                    {registroMsg}
                </div>
            )}
            <style>
                {`
                @keyframes fadeInScale {
                    0% { opacity: 0; transform: scale(0.9);}
                    100% { opacity: 1; transform: scale(1);}
                }
                `}
            </style>
        </div>
    );
};

export default CamaraPage;

