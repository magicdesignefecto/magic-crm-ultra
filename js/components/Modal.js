/**
 * [cite_start]Componente Modal Reutilizable [cite: 92]
 * Gestiona ventanas emergentes con animación y fondo oscuro.
 */
export const Modal = {
    /**
     * Genera el HTML del modal (oculto por defecto)
     * @param {string} title - Título de la ventana
     * @param {string} contentHTML - El formulario o contenido interno
     * @param {string} modalId - ID único para identificar esta ventana
     */
    render: (title, contentHTML, modalId = 'genericModal') => {
        return `
            <div id="${modalId}" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="btn-close-modal" data-close="${modalId}">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${contentHTML}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Abre el modal con animación (agrega clase visible)
     */
    open: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('visible');
        }
    },

    /**
     * Cierra el modal (quita clase visible)
     */
    close: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
        }
    },

    /**
     * Inicializa los eventos de cerrar (botón X y clic afuera)
     */
    initEvents: (modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 1. Botón de cerrar (X)
        const closeBtns = modal.querySelectorAll('.btn-close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar comportamientos extraños
                Modal.close(modalId);
            });
        });

        // 2. Clic en el fondo oscuro (fuera de la tarjeta)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Modal.close(modalId);
            }
        });
    }
};