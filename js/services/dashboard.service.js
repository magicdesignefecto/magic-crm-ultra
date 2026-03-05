// DashboardService - Optimizado con Caché
import { db, auth } from '../core/firebase-config.js';
import { collection, getCountFromServer, getDocs, getDoc, query, orderBy, limit, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CacheManager } from '../utils/cache-manager.js';

const CACHE_KEY = 'dashboard';

export const DashboardService = {
    getData: async (forceRefresh = false) => {
        try {
            const user = auth.currentUser;
            if (!user) return {
                stats: { clients: 0, leads: 0, projects: 0, revenue: 0, goalsCompleted: 0, pendingActions: 0 },
                recentLeads: [],
                goalsProgress: [],
                upcomingActions: []
            };

            const cacheKey = `${CACHE_KEY}_${user.uid}`;

            // Verificar caché (1 minuto TTL para dashboard - se actualiza frecuentemente)
            if (!forceRefresh) {
                const cached = CacheManager.get(cacheKey);
                if (cached) return cached;
            }

            // ========== OBTENER DATOS ==========

            // Usar caché de otros servicios si disponible
            let clients = CacheManager.get(`clients_${user.uid}`);
            let leads = CacheManager.get(`leads_${user.uid}`);
            let projects = CacheManager.get(`projects_${user.uid}`);
            let quotes = CacheManager.get(`quotes_${user.uid}`);
            let goals = CacheManager.get(`goals_${user.uid}`);

            // Solo ir a Firebase para lo que no está en caché
            const promises = [];

            if (!clients) {
                const clientsColl = collection(db, "clients");
                const qClients = query(clientsColl, where("userId", "==", user.uid));
                promises.push(
                    getCountFromServer(qClients).then(snap => ({ type: 'clients', count: snap.data().count }))
                );
            }

            if (!leads) {
                const leadsColl = collection(db, "leads");
                const qLeads = query(leadsColl, where("userId", "==", user.uid));
                promises.push(
                    getDocs(qLeads).then(snap => ({
                        type: 'leads',
                        data: snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    }))
                );
            }

            if (!projects) {
                const projectsColl = collection(db, "projects");
                const qProjects = query(projectsColl, where("userId", "==", user.uid));
                promises.push(
                    getDocs(qProjects).then(snap => ({
                        type: 'projects',
                        data: snap.docs.map(d => d.data())
                    })).catch(() => ({ type: 'projects', data: [] }))
                );
            }

            if (!quotes) {
                const quotesRef = collection(db, "quotes");
                const qQuotes = query(quotesRef, where("userId", "==", user.uid));
                promises.push(
                    getDocs(qQuotes).then(snap => ({
                        type: 'quotes',
                        data: snap.docs.map(d => d.data())
                    })).catch(() => ({ type: 'quotes', data: [] }))
                );
            }

            if (!goals) {
                const goalsColl = collection(db, "goals");
                const qGoals = query(goalsColl, where("userId", "==", user.uid));
                promises.push(
                    getDocs(qGoals).then(snap => ({
                        type: 'goals',
                        data: snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    })).catch(() => ({ type: 'goals', data: [] }))
                );
            }

            // Ejecutar todas las queries en paralelo
            const results = await Promise.all(promises);

            // Procesar resultados
            let totalClients = clients ? clients.length : 0;
            let allLeads = leads || [];
            let allProjects = projects || [];
            let allQuotes = quotes || [];
            let allGoals = goals || [];

            results.forEach(r => {
                if (r.type === 'clients') totalClients = r.count;
                if (r.type === 'leads') allLeads = r.data;
                if (r.type === 'projects') allProjects = r.data || [];
                if (r.type === 'quotes') allQuotes = r.data;
                if (r.type === 'goals') allGoals = r.data;
            });

            const totalProjects = allProjects.length;
            const projectsByStatus = {
                activos: allProjects.filter(p => p.status === 'Activo').length,
                finalizados: allProjects.filter(p => p.status === 'Finalizado').length,
                borradores: allProjects.filter(p => p.status === 'Borrador').length,
                revision: allProjects.filter(p => p.status === 'Revisión Pago').length
            };

            // ========== CALCULAR ESTADÍSTICAS ==========

            const totalLeads = allLeads.length;
            const revenue = allLeads.reduce((acc, lead) => acc + (Number(lead.total) || 0), 0);
            const pendingActions = allLeads.reduce((acc, lead) => {
                if (!lead.actions || !Array.isArray(lead.actions)) return acc;
                return acc + lead.actions.filter(a => typeof a !== 'string' && !a.completed).length;
            }, 0);

            // Recent leads (del caché o de los datos frescos)
            const recentLeads = [...allLeads]
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 5);

            // ========== CALCULAR PROGRESO DE METAS ==========

            let goalsProgress = [];
            let goalsCompleted = 0;

            for (const data of allGoals) {
                const goalType = data.type || 'sales';
                let current = 0;

                if (data.startDate && data.targetDate) {
                    const startDate = new Date(data.startDate).toISOString();
                    const endDate = new Date(data.targetDate + 'T23:59:59').toISOString();

                    if (goalType === 'leads') {
                        allLeads.forEach(lead => {
                            const createdAt = lead.createdAt || '';
                            if (createdAt >= startDate && createdAt <= endDate) current++;
                        });
                    } else {
                        allQuotes.forEach(qData => {
                            const createdAt = qData.createdAt || '';
                            const status = (qData.status || '').toLowerCase();
                            const currency = qData.currency || 'BOB';

                            if (createdAt >= startDate && createdAt <= endDate && currency === (data.currency || 'BOB')) {
                                if (['aceptada', 'aprobada', 'cerrada', 'accepted', 'closed'].includes(status)) {
                                    current += parseFloat(qData.total) || 0;
                                }
                            }
                        });
                    }
                }

                const target = data.target || 0;
                const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                if (percent >= 100) goalsCompleted++;

                goalsProgress.push({
                    id: data.id,
                    name: data.name || 'Meta',
                    type: goalType,
                    currency: data.currency || null,
                    target: target,
                    current: current,
                    percent: percent
                });
            }

            // ========== TODAS LAS ACCIONES (historial completo) ==========

            const allActions = [];
            const today = new Date(); today.setHours(0, 0, 0, 0);

            allLeads.forEach(lead => {
                if (lead.status === 'Pausa') return; // Leads en pausa no generan acciones
                if (!lead.actions || !Array.isArray(lead.actions)) return;
                lead.actions.forEach((action, idx) => {
                    // Retrocompatibilidad: ignorar strings sin fecha
                    if (typeof action === 'string') return;
                    if (!action.date) return;

                    if (action.recurring) {
                        // Determinar frecuencia: 'monthly', 'yearly', o true (legacy = monthly)
                        const freq = action.recurring === true ? 'monthly' : action.recurring;
                        const monthStep = freq === 'yearly' ? 12 : 1;

                        const origDate = new Date(action.date + 'T00:00:00');
                        const dayOfMonth = origDate.getDate();
                        const startMonth = origDate.getMonth();
                        const startYear = origDate.getFullYear();

                        // Calcular hasta 3 meses (mensual) o 2 años (anual) en el futuro
                        const futureLimit = new Date(today);
                        futureLimit.setMonth(futureLimit.getMonth() + (freq === 'yearly' ? 24 : 3));

                        let current = new Date(startYear, startMonth, 1);
                        while (current <= futureLimit) {
                            const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
                            const day = Math.min(dayOfMonth, lastDay);
                            const instanceDate = new Date(current.getFullYear(), current.getMonth(), day);
                            const dateStr = instanceDate.toISOString().split('T')[0];

                            const diffDays = Math.ceil((instanceDate - today) / (1000 * 60 * 60 * 24));

                            let status = 'upcoming';
                            if (diffDays < 0) status = 'overdue';
                            else if (diffDays <= 3) status = 'soon';

                            const isCompleted = action.completedInstances && action.completedInstances[dateStr];

                            allActions.push({
                                leadId: lead.id,
                                leadName: lead.name || 'Sin nombre',
                                leadCompany: lead.company || '',
                                leadPhone: lead.phone || '',
                                leadEmail: lead.email || '',
                                leadTotal: lead.total || 0,
                                leadCurrency: lead.currency || 'BOB',
                                leadServices: lead.services || [],
                                actionText: action.text,
                                date: dateStr,
                                diffDays: diffDays,
                                status: status,
                                actionIndex: idx,
                                recurring: freq,
                                completed: isCompleted || false,
                                completedAt: isCompleted ? action.completedInstances[dateStr] : null
                            });

                            // Avanzar según frecuencia
                            current.setMonth(current.getMonth() + monthStep);
                        }
                    } else {
                        // Acción normal (no recurrente)
                        const dueDate = new Date(action.date + 'T00:00:00');
                        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                        let status = 'upcoming';
                        if (diffDays < 0) status = 'overdue';
                        else if (diffDays <= 3) status = 'soon';

                        allActions.push({
                            leadId: lead.id,
                            leadName: lead.name || 'Sin nombre',
                            leadCompany: lead.company || '',
                            leadPhone: lead.phone || '',
                            leadEmail: lead.email || '',
                            leadTotal: lead.total || 0,
                            leadCurrency: lead.currency || 'BOB',
                            leadServices: lead.services || [],
                            actionText: action.text,
                            date: action.date,
                            diffDays: diffDays,
                            status: status,
                            actionIndex: idx,
                            recurring: false,
                            completed: action.completed || false,
                            completedAt: action.completedAt || null
                        });
                    }
                });
            });

            // ========== COBROS REGULARES (desde billing) ==========
            allLeads.forEach(lead => {
                if (lead.status === 'Pausa') return; // Leads en pausa no generan cobros
                if (!lead.billing || !lead.billing.frequency || !lead.billing.active) return;

                const b = lead.billing;
                const dayOfMonth = b.dayOfMonth || 1;

                // Calcular monthStep según frecuencia
                let monthStep = 1;
                if (b.frequency === 'yearly') monthStep = 12;
                else if (b.frequency === 'custom' && b.customInterval) {
                    const cv = b.customInterval.value || 1;
                    monthStep = b.customInterval.unit === 'years' ? cv * 12 : cv;
                }

                // Fecha de registro del lead
                const leadDate = lead.date ? new Date(lead.date + 'T00:00:00') : new Date();

                // Límite futuro: generar hasta 12 meses adelante (mensual) o 24 meses (anual)
                const futureLimit = new Date(today);
                futureLimit.setMonth(futureLimit.getMonth() + (monthStep >= 12 ? 24 : 12));

                // *** INICIO: desde el mes actual ***
                // Solo generamos desde el mes actual + futuro
                // Los meses pasados no rastreados no aparecen como vencidos
                const startFrom = new Date(today.getFullYear(), today.getMonth(), 1);
                // Pero nunca antes de la fecha de registro
                let current = startFrom > leadDate ? new Date(startFrom) : new Date(leadDate.getFullYear(), leadDate.getMonth(), 1);

                // Si el día de cobro ya pasó en el mes de inicio, verificar si aplica
                const firstBillingInMonth = new Date(current.getFullYear(), current.getMonth(), Math.min(dayOfMonth, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()));
                if (firstBillingInMonth < leadDate) {
                    current.setMonth(current.getMonth() + monthStep);
                }

                while (current <= futureLimit) {
                    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
                    const day = Math.min(dayOfMonth, lastDay);
                    const instanceDate = new Date(current.getFullYear(), current.getMonth(), day);

                    // Seguridad: no generar instancias antes de la fecha de registro
                    if (instanceDate < leadDate) {
                        current.setMonth(current.getMonth() + monthStep);
                        continue;
                    }

                    const dateStr = instanceDate.toISOString().split('T')[0];

                    const diffDays = Math.ceil((instanceDate - today) / (1000 * 60 * 60 * 24));

                    let status = 'upcoming';
                    if (diffDays < 0) status = 'overdue';
                    else if (diffDays <= 3) status = 'soon';

                    const isCompleted = b.completedInstances && b.completedInstances[dateStr];

                    // Texto: servicio + concepto
                    const billingText = [b.service, b.concept].filter(Boolean).join(' — ') || 'Cobro regular';

                    allActions.push({
                        leadId: lead.id,
                        leadName: lead.name || 'Sin nombre',
                        leadCompany: lead.company || '',
                        leadPhone: lead.phone || '',
                        leadEmail: lead.email || '',
                        leadTotal: b.amount || lead.total || 0,
                        leadCurrency: b.currency || lead.currency || 'BOB',
                        leadServices: lead.services || [],
                        billingService: b.service || '',
                        billingConcept: b.concept || '',
                        billingAdvance: b.advance || 0,
                        billingAdvanceConcept: b.advanceConcept || '',
                        actionText: billingText,
                        date: dateStr,
                        diffDays: diffDays,
                        status: status,
                        actionIndex: -1,
                        recurring: b.frequency,
                        isBilling: true,
                        completed: isCompleted || false,
                        completedAt: isCompleted ? b.completedInstances[dateStr] : null
                    });

                    current.setMonth(current.getMonth() + monthStep);
                }
            });

            // Ordenar: vencidas primero, luego por fecha más cercana
            allActions.sort((a, b) => a.diffDays - b.diffDays);

            // ========== RESULTADO FINAL ==========

            const result = {
                stats: {
                    clients: totalClients,
                    leads: totalLeads,
                    projects: totalProjects,
                    projectsByStatus: projectsByStatus,
                    revenue: revenue,
                    goalsCompleted: goalsCompleted,
                    pendingActions: pendingActions
                },
                allLeads: allLeads,
                recentLeads: recentLeads,
                goalsProgress: goalsProgress,
                upcomingActions: allActions
            };

            // Guardar en caché (1 minuto)
            CacheManager.set(cacheKey, result, 60 * 1000);

            return result;

        } catch (error) {
            console.error("Error cargando Dashboard:", error);
            return {
                stats: { clients: 0, leads: 0, projects: 0, revenue: 0, goalsCompleted: 0, pendingActions: 0 },
                recentLeads: [],
                goalsProgress: [],
                upcomingActions: []
            };
        }
    },

    // Marcar acción como completada/no-completada
    completeAction: async (leadId, actionIndex, completed = true, instanceDate = null) => {
        try {
            const user = auth.currentUser;
            if (!user) return { ok: false, error: 'No hay usuario autenticado' };

            const leadRef = doc(db, "leads", leadId);
            const leadSnap = await getDoc(leadRef);

            if (!leadSnap.exists()) return { ok: false, error: `Lead no encontrado: ${leadId}` };

            const leadData = leadSnap.data();

            if (leadData.userId !== user.uid) return { ok: false, error: 'Lead no pertenece al usuario' };

            if (actionIndex === -1 && instanceDate) {
                // ===== COBRO REGULAR (billing) =====
                const billing = JSON.parse(JSON.stringify(leadData.billing || {}));
                if (!billing.completedInstances) billing.completedInstances = {};
                if (completed) {
                    billing.completedInstances[instanceDate] = new Date().toISOString().split('T')[0];
                } else {
                    delete billing.completedInstances[instanceDate];
                }
                await updateDoc(leadRef, { billing: billing });
            } else {
                // ===== ACCIÓN NORMAL =====
                const actions = JSON.parse(JSON.stringify(leadData.actions || []));
                if (actionIndex < 0 || actionIndex >= actions.length) {
                    return { ok: false, error: `Índice ${actionIndex} fuera de rango (total: ${actions.length})` };
                }

                if (instanceDate) {
                    // Acción recurrente legacy
                    if (!actions[actionIndex].completedInstances) {
                        actions[actionIndex].completedInstances = {};
                    }
                    if (completed) {
                        actions[actionIndex].completedInstances[instanceDate] = new Date().toISOString().split('T')[0];
                    } else {
                        delete actions[actionIndex].completedInstances[instanceDate];
                    }
                } else {
                    actions[actionIndex].completed = completed;
                    actions[actionIndex].completedAt = completed ? new Date().toISOString().split('T')[0] : null;
                }
                await updateDoc(leadRef, { actions: actions });
            }

            // Invalidar caché
            CacheManager.invalidate(`dashboard_${user.uid}`);
            CacheManager.invalidate(`leads_${user.uid}`);

            return { ok: true };
        } catch (error) {
            console.error('Error actualizando acción:', error);
            return { ok: false, error: error.message || 'Error desconocido' };
        }
    },

    // Forzar actualización
    refresh: async () => {
        return await DashboardService.getData(true);
    }
};
