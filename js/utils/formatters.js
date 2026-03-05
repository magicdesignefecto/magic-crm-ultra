/**
 * Utilidades de formato estándar
 * Moneda por defecto: BOB (Bolivianos)
 * Monedas soportadas: BOB, USD, EUR
 */
export const Formatters = {
    /**
     * Formatea un número a moneda
     * @param {number} amount - Cantidad
     * @param {string} currency - 'BOB', 'USD' o 'EUR' (default: BOB)
     */
    toCurrency: (amount, currency = 'BOB') => {
        // Mapear locale según moneda para mejor formato
        const locales = {
            'BOB': 'es-BO',
            'USD': 'en-US',
            'EUR': 'es-ES'
        };

        return new Intl.NumberFormat(locales[currency] || 'es-BO', {
            style: 'currency',
            currency: currency || 'BOB',
            minimumFractionDigits: 2
        }).format(amount || 0);
    },

    /**
     * Formatea fecha corta
     */
    toDate: (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric'
        }).format(date);
    }
};