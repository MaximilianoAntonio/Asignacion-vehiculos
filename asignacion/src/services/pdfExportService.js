import jsPDF from 'jspdf';

// Función para formatear fecha como "11 / Junio / 14:30"
function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const fecha = new Date(fechaStr);
  const dia = fecha.getDate();
  const mes = fecha.toLocaleString('es-ES', { month: 'long' });
  const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia} / ${mes.charAt(0).toUpperCase() + mes.slice(1)} / ${hora}`;
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