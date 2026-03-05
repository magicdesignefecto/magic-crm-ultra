/**
 * PubSub - Sistema de Eventos Publish/Subscribe
 * Permite comunicación desacoplada entre módulos del CRM.
 */
export const PubSub = {
    events: {},

    /**
     * Suscribirse a un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función a ejecutar
     * @returns {Function} Función para desuscribirse
     */
    subscribe: (event, callback) => {
        if (!PubSub.events[event]) {
            PubSub.events[event] = [];
        }
        PubSub.events[event].push(callback);

        // Retornar función de desuscripción para facilitar cleanup
        return () => PubSub.unsubscribe(event, callback);
    },

    /**
     * Publicar un evento con datos
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos a enviar
     */
    publish: (event, data) => {
        if (PubSub.events[event]) {
            PubSub.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en suscriptor de evento "${event}":`, error);
                }
            });
        }
    },

    /**
     * Desuscribirse de un evento
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Referencia exacta del callback a remover
     */
    unsubscribe: (event, callback) => {
        if (PubSub.events[event]) {
            PubSub.events[event] = PubSub.events[event].filter(cb => cb !== callback);
            // Limpiar array vacío
            if (PubSub.events[event].length === 0) {
                delete PubSub.events[event];
            }
        }
    }
};