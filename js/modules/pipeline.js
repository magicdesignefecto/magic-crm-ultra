import { PipelineService } from '../services/pipeline.service.js';
import { Formatters } from '../utils/formatters.js';

export const PipelineModule = {
    draggedCardId: null,

    render: async () => {
        const pageContent = `
            <div class="page-header" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main);">Pipeline de Ventas</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Arrastra tus oportunidades para avanzar</p>
                    </div>
                    
                    <div style="position: relative;">
                        <input type="text" id="pipelineSearch" placeholder="Buscar..." 
                            style="padding: 10px 10px 10px 35px; border: 1px solid #E5E7EB; border-radius: 20px; width: 220px; outline: none;">
                        <span style="position: absolute; left: 12px; top: 10px; color: #9CA3AF;">🔍</span>
                    </div>
                </div>
            </div>

            <div id="pipelineContainer" style="display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; min-height: 70vh; align-items: flex-start; scroll-behavior: smooth;">
                <div class="loader"></div>
            </div>
        `;

        return pageContent;
    },

    init: async () => {
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) btnLogout.addEventListener('click', () => { Store.setUser(null); Router.navigateTo('/'); });

        await PipelineModule.loadBoard();

        const searchInput = document.getElementById('pipelineSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => PipelineModule.loadBoard(e.target.value.toLowerCase()));
        }
    },

    loadBoard: async (searchTerm = '') => {
        const container = document.getElementById('pipelineContainer');

        try {
            const allDeals = await PipelineService.getAll();
            // Filtrado simple en frontend (idealmente esto lo hace el backend)
            const deals = allDeals.filter(d =>
                (d.title && d.title.toLowerCase().includes(searchTerm)) ||
                (d.client && d.client.toLowerCase().includes(searchTerm))
            );

            const stages = ['Nuevo', 'Propuesta', 'Negociación', 'Cierre', 'Pausa'];
            const stageColors = { 'Nuevo': '#3B82F6', 'Propuesta': '#8B5CF6', 'Negociación': '#F59E0B', 'Cierre': '#10B981', 'Pausa': '#EF4444' };

            container.innerHTML = stages.map(stage => {
                const items = deals.filter(d => d.stage === stage);

                // --- CÁLCULO MULTIMONEDA CORRECTO ---
                // Separamos las sumas por moneda para no mezclar
                let totalBOB = 0;
                let totalUSD = 0;
                let totalEUR = 0;

                items.forEach(item => {
                    if (item.currency === 'BOB') totalBOB += (item.value || 0);
                    else if (item.currency === 'USD') totalUSD += (item.value || 0);
                    else if (item.currency === 'EUR') totalEUR += (item.value || 0);
                });

                // Formateamos el texto del total (Ej: "Bs 500 | $1,000 | €200")
                let parts = [];
                if (totalBOB > 0) parts.push(`<span style="color:#111;">${Formatters.toCurrency(totalBOB, 'BOB')}</span>`);
                if (totalUSD > 0) parts.push(`<span style="color:#111;">${Formatters.toCurrency(totalUSD, 'USD')}</span>`);
                if (totalEUR > 0) parts.push(`<span style="color:#111;">${Formatters.toCurrency(totalEUR, 'EUR')}</span>`);
                let totalText = parts.length > 0 ? parts.join(' <span style="color:#CCC;">|</span> ') : '<span style="color:#999;">-</span>';
                // -------------------------------------

                return `
                <div class="kanban-column" data-stage="${stage}" style="min-width: 290px; background: #F3F4F6; border-radius: 12px; padding: 15px; flex-shrink: 0; display: flex; flex-direction: column;">
                    <div style="border-bottom: 3px solid ${stageColors[stage]}; padding-bottom: 10px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin:0;">${stage}</h3>
                            <span style="background: var(--bg-card); padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">${items.length}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px; font-weight:600;">
                            ${totalText}
                        </div>
                    </div>

                    <div class="drop-zone" data-stage="${stage}" style="min-height: 200px; flex: 1; display: flex; flex-direction: column; gap: 10px;">
                        ${items.map(item => `
                            <div class="kanban-card" draggable="true" data-id="${item.id}"
                                 style="background: var(--bg-card); padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid ${stageColors[stage]}; cursor: grab; position: relative;">
                                <h4 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 5px 0; color: var(--text-main); pointer-events: none;">${item.title}</h4>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 8px 0; pointer-events: none;">${item.client || 'Sin cliente'}</p>
                                <div style="display: flex; justify-content: space-between; align-items: center; pointer-events: none;">
                                    <span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem;">${Formatters.toCurrency(item.value, item.currency)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }).join('');

            PipelineModule.enableDragAndDrop();

        } catch (e) { console.error(e); container.innerHTML = '<p>Error pipeline.</p>'; }
    },

    enableDragAndDrop: () => {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.kanban-column');

        // PC MOUSE EVENTS
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                PipelineModule.draggedCardId = card.getAttribute('data-id');
                e.dataTransfer.setData('text/plain', PipelineModule.draggedCardId);
                setTimeout(() => card.style.opacity = '0.5', 0);
            });
            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
                PipelineModule.draggedCardId = null;
                columns.forEach(c => c.style.background = '#F3F4F6');
            });
        });

        columns.forEach(col => {
            col.addEventListener('dragover', (e) => { e.preventDefault(); col.style.background = '#E5E7EB'; });
            col.addEventListener('dragleave', () => { col.style.background = '#F3F4F6'; });
            col.addEventListener('drop', async (e) => {
                e.preventDefault(); col.style.background = '#F3F4F6';
                const cardId = e.dataTransfer.getData('text/plain');
                const newStage = col.getAttribute('data-stage');
                if (cardId && newStage) {
                    await PipelineService.updateStage(cardId, newStage);
                    PipelineModule.loadBoard(document.getElementById('pipelineSearch').value);
                }
            });
        });

        // MOBILE TOUCH EVENTS
        let touchCard = null;
        let touchClone = null;

        cards.forEach(card => {
            card.addEventListener('touchstart', (e) => {
                touchCard = card;
                touchClone = card.cloneNode(true);
                touchClone.style.position = 'fixed';
                touchClone.style.zIndex = '1000';
                touchClone.style.width = card.offsetWidth + 'px';
                touchClone.style.opacity = '0.8';
                touchClone.style.pointerEvents = 'none';
                touchClone.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                const touch = e.touches[0];
                touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
                touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';
                document.body.appendChild(touchClone);
                card.style.opacity = '0.4';
            }, { passive: false });

            card.addEventListener('touchmove', (e) => {
                if (!touchCard || !touchClone) return;
                e.preventDefault();
                const touch = e.touches[0];
                touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
                touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';
            }, { passive: false });

            card.addEventListener('touchend', async (e) => {
                if (!touchCard) return;
                const touch = e.changedTouches[0];
                touchClone.style.display = 'none';
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetColumn = elementBelow ? elementBelow.closest('.kanban-column') : null;
                if (targetColumn) {
                    const newStage = targetColumn.getAttribute('data-stage');
                    const cardId = touchCard.getAttribute('data-id');
                    if (newStage && cardId) {
                        await PipelineService.updateStage(cardId, newStage);
                        PipelineModule.loadBoard(document.getElementById('pipelineSearch').value);
                    }
                }
                if (touchClone) document.body.removeChild(touchClone);
                if (touchCard) touchCard.style.opacity = '1';
                touchCard = null; touchClone = null;
            });
        });
    },

    destroy: () => { }
};
