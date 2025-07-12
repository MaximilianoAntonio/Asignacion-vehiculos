import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Función para formatear fecha como "11 / Junio / 14:30"
export function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const fecha = new Date(fechaStr);
  const dia = fecha.getDate();
  const mes = fecha.toLocaleString('es-ES', { month: 'long' });
  const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia} / ${mes.charAt(0).toUpperCase() + mes.slice(1)} / ${hora}`;
}

export function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function exportTurnosPDF(conductor, turnos, reportPeriod) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Reporte de Turnos: ${conductor.nombre} ${conductor.apellido}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período del ${reportPeriod.start} al ${reportPeriod.end}`, 14, 30);

    const tableColumn = ["Inicio Turno", "Fin Turno", "Duración"];
    const tableRows = [];
    let totalDurationMs = 0;
    let lastDateStr = null;

    turnos.forEach(turno => {
        const startStr = turno.start?.fecha_hora;
        const endStr = turno.end?.fecha_hora;
        const turnoDate = startStr || endStr;

        if (turnoDate) {
            const date = new Date(turnoDate);
            const currentDateStr = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            if (currentDateStr !== lastDateStr) {
                tableRows.push([{
                    content: currentDateStr,
                    colSpan: 3,
                    styles: { fontStyle: 'bold', fillColor: '#f0f0f0', textColor: '#333', halign: 'center' }
                }]);
                lastDateStr = currentDateStr;
            }
        }

        if (startStr && endStr) {
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            if (endDate > startDate) {
                totalDurationMs += endDate - startDate;
            }
        }

        const turnoData = [
            formatTime(startStr),
            formatTime(endStr),
            turno.duration || 'En curso'
        ];
        tableRows.push(turnoData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    });

    const hours = Math.floor(totalDurationMs / 3600000);
    const minutes = Math.floor((totalDurationMs % 3600000) / 60000);
    const totalDurationStr = `Duración Total: ${hours}h ${minutes}m`;
    
    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(totalDurationStr, 14, finalY + 10);

    const today = new Date().toISOString().slice(0, 10);
    doc.save(`reporte_turnos_${conductor.apellido}_${today}.pdf`);
}

export function exportAsignacionesPDF(asignaciones) {
  // Crear el PDF en orientación horizontal (landscape)
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Función para normalizar estados
  const normalizeEstado = (estado) => {
    const estadosIndividuales = {
      pendiente_auto: 'Pendiente',
      programada: 'Programada',
      activa: 'En Curso',
      completada: 'Finalizada',
      cancelada: 'Cancelada',
      fallo_auto: 'Fallo Auto'
    };
    return estadosIndividuales[estado] || estado;
  };

  // Preparar datos para la tabla
  const tableData = asignaciones.map(a => [
    a.vehiculo?.patente || '—',
    a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—',
    a.solicitante_nombre || '—',
    a.responsable_nombre || '—',
    a.destino_descripcion || '—',
    a.origen_descripcion || '—',
    formatearFecha(a.fecha_hora_requerida_inicio),
    formatearFecha(a.fecha_hora_fin_prevista),
    normalizeEstado(a.estado)
  ]);

  // Usar autoTable para mejor formateo
  autoTable(doc, {
    head: [['Vehículo', 'Conductor', 'Solicitante', 'Responsable', 'Destino', 'Origen', 'Inicio', 'Fin Previsto', 'Estado']],
    body: tableData,
    startY: 25,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Vehículo
      1: { cellWidth: 35 }, // Conductor
      2: { cellWidth: 30 }, // Solicitante
      3: { cellWidth: 30 }, // Responsable
      4: { cellWidth: 40 }, // Destino
      5: { cellWidth: 40 }, // Origen
      6: { cellWidth: 30 }, // Inicio
      7: { cellWidth: 30 }, // Fin Previsto
      8: { cellWidth: 20 }  // Estado
    },
    margin: { top: 20, left: 10, right: 10 },
    didDrawPage: function (data) {
      // Título en cada página
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Listado de Asignaciones', 14, 15);
      
      // Fecha del reporte
      const today = new Date();
      const fechaReporte = today.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado el ${fechaReporte}`, 14, 22);
    }
  });

  // Fecha en el nombre del archivo
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const fecha = `${yyyy}-${mm}-${dd}`;

  doc.save(`asignaciones_${fecha}.pdf`);
}