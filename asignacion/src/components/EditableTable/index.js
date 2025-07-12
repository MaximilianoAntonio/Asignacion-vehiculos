import { h } from 'preact';
import style from './style.css';

const EditableTable = ({ 
  columns, 
  data, 
  onRowClick, 
  loading, 
  error, 
  emptyMessage = "No hay datos disponibles",
  tipMessage = "Haz clic en cualquier fila para ver detalles",
  showTip = true,
  selectedRowId = null,
  className = ""
}) => {
  if (loading) return <p>Cargando...</p>;
  if (error) return <p class="error-message">{error}</p>;

  return (
    <div class={`table-container ${className}`}>
      {showTip && (
        <div class={style.tableTip}>
          <i class="fas fa-info-circle"></i>
          <span>{tipMessage}</span>
        </div>
      )}
      
      <table class="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} class="text-center">{emptyMessage}</td>
            </tr>
          ) : (
            data.map(row => (
              <tr 
                key={row.id} 
                class={`slide-in-up ${style.clickableRow} ${selectedRowId === row.id ? style.selectedRow : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
                title="Haz clic para ver detalles"
              >
                {columns.map(col => (
                  <td key={col.key} data-label={col.label}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;
