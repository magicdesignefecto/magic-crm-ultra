import { PubSub } from './pubsub.js';

export const Store = {
    state: {
        user: null,
        leads: [],
        clients: [],
        tasks: []
    },

    init() {
        // --- PROTECCIÓN CONTRA ERRORES (Recomendación de Claude) ---
        try {
            const savedUser = localStorage.getItem('crm_user');
            if (savedUser) {
                this.state.user = JSON.parse(savedUser);
            }
        } catch (error) {
            console.error('Error recuperando sesión, limpiando datos corruptos...', error);
            localStorage.removeItem('crm_user');
            this.state.user = null;
        }
    },

    getState() {
        return this.state;
    },

    setUser(user) {
        this.state.user = user;
        if (user) {
            localStorage.setItem('crm_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('crm_user');
        }
        PubSub.publish('AUTH_CHANGED', user);
    }
};
