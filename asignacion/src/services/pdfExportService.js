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
  doc.setFontSize(16);
  doc.text('Listado de Asignaciones', 10, 15);

  const headers = [
    'Vehículo', 'Conductor', 'Destino', 'Origen', 'Inicio', 'Fin Previsto', 'Estado'
  ];

  // Medidas de la hoja
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Márgenes y cálculo de anchos de columna para ajustar a la hoja
  const marginX = 10;
  const marginY = 20;
  const tableWidth = pageWidth - marginX * 2;
  const colCount = headers.length;
  // Puedes personalizar los porcentajes si alguna columna debe ser más ancha
  const colPercents = [0.13, 0.17, 0.18, 0.18, 0.12, 0.12, 0.10];
  const colWidths = colPercents.map(p => Math.floor(tableWidth * p));
  const rowHeight = 9;
  let y = marginY + rowHeight;

  doc.setFontSize(12);

  // Dibujar fondo de encabezado
  doc.setFillColor(220, 220, 220);
  doc.rect(marginX, marginY, tableWidth, rowHeight, 'F');

  // Dibujar encabezados
  let x = marginX;
  doc.setTextColor(40, 40, 40);
  doc.setFont(undefined, 'bold');
  headers.forEach((header, i) => {
    doc.text(header, x + 2, marginY + rowHeight - 2, { maxWidth: colWidths[i] - 4 });
    x += colWidths[i];
  });
  doc.setFont(undefined, 'normal');

  // Dibujar filas
  y += 2;
  asignaciones.forEach(a => {
    let x = marginX;
    const row = [
      a.vehiculo?.patente || '—',
      a.conductor ? `${a.conductor.nombre} ${a.conductor.apellido}` : '—',
      a.destino_descripcion,
      a.origen_descripcion || '—',
      formatearFecha(a.fecha_hora_requerida_inicio),
      formatearFecha(a.fecha_hora_fin_prevista),
      a.estado
    ];

    // Calcular el alto máximo de la fila según el texto envuelto
    let cellHeights = row.map((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colWidths[i] - 4);
      return lines.length * rowHeight;
    });
    const maxCellHeight = Math.max(...cellHeights, rowHeight);

    // Dibujar fondo alterno para filas
    if (asignaciones.indexOf(a) % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(marginX, y - 2, tableWidth, maxCellHeight, 'F');
    }

    // Dibujar celdas
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colWidths[i] - 4);
      doc.setTextColor(30, 30, 30);
      doc.text(lines, x + 2, y + rowHeight - 4, { maxWidth: colWidths[i] - 4 });
      x += colWidths[i];
    });

    // Dibujar líneas horizontales de la fila
    doc.setDrawColor(180, 180, 180);
    doc.line(marginX, y - 2, marginX + tableWidth, y - 2);

    y += maxCellHeight;
    // Salto de página si es necesario
    if (y + rowHeight > pageHeight - marginY) {
      // Dibujar línea inferior antes de salto
      doc.line(marginX, y - 2, marginX + tableWidth, y - 2);
      doc.addPage({ orientation: 'landscape' });
      y = marginY + rowHeight * 2;
      // Redibujar encabezado en nueva página
      doc.setFillColor(220, 220, 220);
      doc.rect(marginX, marginY, tableWidth, rowHeight, 'F');
      let xh = marginX;
      doc.setFont(undefined, 'bold');
      headers.forEach((header, i) => {
        doc.text(header, xh + 2, marginY + rowHeight - 2, { maxWidth: colWidths[i] - 4 });
        xh += colWidths[i];
      });
      doc.setFont(undefined, 'normal');
      y = marginY + rowHeight * 2;
    }
  });

  // Dibujar líneas de tabla verticales
  let lineX = marginX;
  for (let i = 0; i <= colCount; i++) {
    doc.setDrawColor(180, 180, 180);
    doc.line(lineX, marginY, lineX, y - 2);
    lineX += colWidths[i] || 0;
  }
  // Línea inferior final
  doc.line(marginX, y - 2, marginX + tableWidth, y - 2);

  // Fecha en el nombre del archivo
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const fecha = `${yyyy}-${mm}-${dd}`;

  doc.save(`asignaciones_${fecha}.pdf`);
}