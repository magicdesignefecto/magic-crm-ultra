/**
 * Componente Tabla Reutilizable
 * Genera HTML de tablas modernas automáticamente
 */
export const Table = {
    render: (columns, data, actions = []) => {
        if (!data || data.length === 0) {
            return `<div style="padding: 20px; text-align: center; color: var(--text-muted);">No hay datos para mostrar</div>`;
        }

        // 1. Generar Cabeceras
        const headersHTML = columns.map(col => `
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid var(--border-light); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">
                ${col.header}
            </th>
        `).join('');

        // 2. Generar Filas
        const rowsHTML = data.map(row => `
            <tr style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='transparent'">
                ${columns.map(col => `
                    <td style="padding: 14px 12px; color: var(--text-main); font-size: 0.95rem;">
                        ${col.render ? col.render(row) : row[col.key]}
                    </td>
                `).join('')}
            </tr>
        `).join('');

        // 3. Devolver Tabla Completa
        return `
            <div style="overflow-x: auto; background: var(--bg-card); border-radius: var(--radius-md); box-shadow: var(--shadow-card);">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead><tr>${headersHTML}</tr></thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </div>
        `;
    }
};