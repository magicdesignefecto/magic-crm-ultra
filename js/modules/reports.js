import { ProjectsService } from '../services/projects.service.js';
import { Formatters } from '../utils/formatters.js';

export const ReportsModule = {
    render: async () => {
        const content = `
            <style>
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .summary-card { background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-card); }
                .summary-val { font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: block; margin-top: 5px; }
                .chart-container { background: var(--bg-card); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); min-height: 200px; }
            </style>
            
            <div class="page-header">
                <h2>Reporte Financiero</h2>
                <p>Análisis de rentabilidad real</p>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <small>Ventas Totales</small>
                    <span class="summary-val" id="kpiSales">...</span>
                </div>
                <div class="summary-card">
                    <small>Costos Operativos</small>
                    <span class="summary-val" id="kpiCosts" style="color:#EF4444;">...</span>
                </div>
                <div class="summary-card">
                    <small>Rentabilidad Neta</small>
                    <span class="summary-val" id="kpiProfit">...</span>
                </div>
            </div>

            <div class="chart-container">
                <h4 style="margin-bottom:20px;">Rentabilidad por Proyecto</h4>
                <div id="projectsListReport" style="display:flex; flex-direction:column; gap:10px;">
                    <div class="loader"></div>
                </div>
            </div>
        `;

        return content;
    },

    init: async () => {
        // 1. Obtener Datos Reales
        const projects = await ProjectsService.getAll();

        let totalSales = 0;
        let totalCosts = 0;

        // 2. Calcular Totales
        projects.forEach(p => {
            totalSales += Number(p.budget || 0);
            totalCosts += Number(p.costs || 0);
        });

        const profit = totalSales - totalCosts;

        // 3. Renderizar KPIs
        const kpiSales = document.getElementById('kpiSales');
        const kpiCosts = document.getElementById('kpiCosts');
        const kpiProfit = document.getElementById('kpiProfit');

        if (kpiSales) kpiSales.innerText = Formatters.toCurrency(totalSales, 'BOB');
        if (kpiCosts) kpiCosts.innerText = Formatters.toCurrency(totalCosts, 'BOB');

        if (kpiProfit) {
            kpiProfit.innerText = Formatters.toCurrency(profit, 'BOB');
            kpiProfit.style.color = profit >= 0 ? '#10B981' : '#EF4444';
        }

        // 4. Renderizar Lista de Proyectos (Barras)
        const listContainer = document.getElementById('projectsListReport');

        if (listContainer) {
            if (projects.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No hay datos financieros para mostrar.</p>';
            } else {
                listContainer.innerHTML = projects.map(p => {
                    const pProfit = (p.budget || 0) - (p.costs || 0);
                    const percent = p.budget > 0 ? Math.round((pProfit / p.budget) * 100) : 0;
                    const color = percent > 30 ? '#10B981' : (percent > 0 ? '#F59E0B' : '#EF4444');

                    return `
                        <div style="display:flex; align-items:center; gap:10px; font-size:0.9rem;">
                            <div style="width:30%; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-main);">${p.name}</div>
                            <div style="flex:1; background:var(--border-color); height:8px; border-radius:4px; overflow:hidden;">
                                <div style="width:${Math.max(0, percent)}%; background:${color}; height:100%;"></div>
                            </div>
                            <div style="width:20%; text-align:right; font-weight:700; color:${color};">${percent}%</div>
                        </div>
                    `;
                }).join('');
            }
        }
    },

    destroy: () => { }
};
