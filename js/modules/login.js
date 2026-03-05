import { AuthService } from '../services/auth.service.js';

export const LoginModule = {
    render: async () => {
        return `
            <style>
                .login-container { 
                    min-height: 100vh; 
                    min-height: 100dvh;
                    width: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    background: #F8FAFC; 
                    padding: 20px; 
                    box-sizing: border-box;
                    overflow-y: auto;
                }

                /* Mobile First - Sin espacio arriba */
                @media (max-width: 480px) {
                    .login-container {
                        align-items: flex-start;
                        padding: 10px;
                        padding-top: 15px;
                    }
                    .auth-card {
                        border-radius: 12px;
                    }
                    .auth-content {
                        padding: 20px;
                    }
                    .logo-circle {
                        width: 65px;
                        height: 65px;
                        margin-bottom: 15px;
                    }
                }

                .auth-card { 
                    background: white; 
                    width: 100%; 
                    max-width: 420px; 
                    border-radius: 16px; 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
                    overflow: hidden; 
                    border: 1px solid #E2E8F0; 
                }
                
                /* TABS */
                .auth-tabs { display: flex; border-bottom: 1px solid #E2E8F0; background: #F1F5F9; }
                .tab-btn { flex: 1; padding: 15px; border: none; background: none; font-weight: 600; color: #64748B; cursor: pointer; transition: 0.3s; }
                .tab-btn.active { background: white; color: #2563EB; border-bottom: 2px solid #2563EB; }
                
                .auth-content { padding: 30px; text-align: center; }
                .logo-circle { width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #F1F5F9; padding: 10px; }
                
                .input-group { margin-bottom: 15px; text-align: left; position: relative; }
                .input-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 5px; }
                .auth-input { width: 100%; padding: 12px; padding-right: 45px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
                .password-wrapper { position: relative; }
                .toggle-pass { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; z-index: 5; }
                .toggle-pass:hover { color: #475569; }
                .toggle-pass svg { width: 20px; height: 20px; }
                
                .btn-auth { width: 100%; padding: 12px; background: #2563EB; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 10px; }
                .btn-auth:hover { background: #1D4ED8; }
                
                .forgot-link { display: block; text-align: right; margin-top: 10px; color: #2563EB; font-size: 0.85rem; text-decoration: none; cursor: pointer; }
                .hidden { display: none; }
            </style>
            
            <div class="login-container">
                <div class="auth-card">
                    <div class="auth-tabs">
                        <button class="tab-btn active" id="tabLogin">Ingresar</button>
                        <button class="tab-btn" id="tabRegister">Solicitar Acceso</button>
                    </div>

                    <div class="auth-content">
                        <div class="logo-circle">
                             <img src="Sidebar Header logo magic design efecto.png" alt="Logo" style="width:100%; height:100%; object-fit:contain;">
                        </div>

                        <form id="loginForm">
                            <h2 style="margin:0 0 15px 0; color:#1E293B;">Bienvenido</h2>
                            <div class="input-group">
                                <label class="input-label">Correo Electrónico</label>
                                <input type="email" id="loginEmail" class="auth-input" required>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Contraseña</label>
                                <div class="password-wrapper">
                                    <input type="password" id="loginPass" class="auth-input" required>
                                    <button type="button" class="toggle-pass" data-target="loginPass"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg></button>
                                </div>
                            </div>
                            <button type="submit" class="btn-auth">Ingresar</button>
                            <a class="forgot-link" id="btnForgot">¿Olvidaste tu contraseña?</a>
                        </form>

                        <form id="registerForm" class="hidden">
                            <h2 style="margin:0 0 15px 0; color:#1E293B;">Solicitud de Registro</h2>
                            <div class="input-group">
                                <label class="input-label">Nombre Completo</label>
                                <input type="text" id="regName" class="auth-input" required placeholder="Tu Nombre">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Correo (Gmail recomendado)</label>
                                <input type="email" id="regEmail" class="auth-input" required>
                            </div>
                            <div class="input-group">
                                <label class="input-label">WhatsApp</label>
                                <input type="tel" id="regPhone" class="auth-input" placeholder="+591..." required>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Cargo</label>
                                <input type="text" id="regRole" class="auth-input" placeholder="Ej: Ventas">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Contraseña</label>
                                <div class="password-wrapper">
                                    <input type="password" id="regPass" class="auth-input" required>
                                    <button type="button" class="toggle-pass" data-target="regPass"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg></button>
                                </div>
                            </div>
                            <button type="submit" class="btn-auth" style="background-color:#2563EB;">Enviar Solicitud</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        const tabLogin = document.getElementById('tabLogin');
        const tabRegister = document.getElementById('tabRegister');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        // Toggle password
        const eyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`;
        const eyeClosed = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>`;
        document.querySelectorAll('.toggle-pass').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                btn.innerHTML = isHidden ? eyeOpen : eyeClosed;
            });
        });

        if (tabLogin && tabRegister) {
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            });

            tabRegister.addEventListener('click', () => {
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            });
        }

        // --- LÓGICA DE LOGIN (Mantiene la alerta inteligente Azul/Roja) ---
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = loginForm.querySelector('button');
                btn.innerText = 'Verificando...';
                btn.disabled = true;

                try {
                    const email = document.getElementById('loginEmail').value;
                    const pass = document.getElementById('loginPass').value;

                    await AuthService.login(email, pass);

                    // Si login exitoso (es aprobado)
                    const Toast = Swal.mixin({
                        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
                        timerProgressBar: true, didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer)
                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                        }
                    });
                    Toast.fire({ icon: 'success', title: '¡Bienvenido de nuevo!' });
                    if (window.navigateTo) window.navigateTo('/dashboard');

                } catch (error) {
                    // Detectamos si el error es por cuenta pendiente
                    if (error.message.includes("revisión") || error.message.includes("aprobación")) {
                        Swal.fire({
                            icon: 'info',
                            title: 'Cuenta en Revisión',
                            text: 'Tu solicitud ha sido recibida pero aún no ha sido aprobada por el administrador.',
                            confirmButtonColor: '#2563EB'
                        });
                    } else {
                        // Error real (contraseña mal)
                        Swal.fire({
                            icon: 'error',
                            title: 'Error de Acceso',
                            text: 'El correo o la contraseña son incorrectos.',
                            confirmButtonColor: '#EF4444'
                        });
                    }

                    btn.innerText = 'Ingresar';
                    btn.disabled = false;
                }
            });
        }

        // --- LÓGICA DE REGISTRO (RESTAURADA CON TU WHATSAPP) ---
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = registerForm.querySelector('button');
                btn.innerText = 'Enviando...';
                btn.disabled = true;

                try {
                    const name = document.getElementById('regName').value;
                    const email = document.getElementById('regEmail').value;
                    const pass = document.getElementById('regPass').value;
                    const phone = document.getElementById('regPhone').value;
                    const role = document.getElementById('regRole').value;

                    // Activamos bandera para que app.js NO muestre su alerta de "Cuenta en Revisión"
                    window.isRegisterFlow = true;

                    // 1. Registramos (y se crea como PENDIENTE)
                    await AuthService.register(email, pass, name, phone, role);

                    // 2. Configuración exacta del WhatsApp al 63212806
                    const adminPhone = "59163212806";
                    const text = `Hola Admin, soy *${name}*.%0A%0AHe solicitado registro en el CRM.%0A📧 ${email}%0A💼 ${role}%0A%0A¿Podrías aprobar mi acceso?`;
                    const waLink = `https://wa.me/${adminPhone}?text=${text}`;

                    // 3. Alerta con los DOS botones (Verde WhatsApp y Cancelar)
                    await Swal.fire({
                        title: '¡Solicitud Enviada!',
                        html: `Tu cuenta ha sido creada y está <b>EN REVISIÓN</b>.<br>Debes notificar al administrador para que te active.`,
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonColor: '#25D366', // Verde WhatsApp
                        cancelButtonColor: '#64748B',
                        confirmButtonText: '<i class="fab fa-whatsapp"></i> Notificar al Admin',
                        cancelButtonText: 'Entendido, esperar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.open(waLink, '_blank');
                        }
                    });

                    // Volver al login visualmente
                    tabLogin.click();

                } catch (error) {
                    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
                } finally {
                    // Esto asegura que el botón se reactive siempre, funcione o falle
                    btn.innerText = 'Enviar Solicitud';
                    btn.disabled = false;
                }
            });
        }

        // Recuperar Contraseña
        const btnForgot = document.getElementById('btnForgot');
        if (btnForgot) {
            btnForgot.addEventListener('click', async () => {
                const { value: email } = await Swal.fire({
                    title: 'Recuperar Contraseña',
                    input: 'email',
                    inputLabel: 'Ingresa tu correo registrado',
                    showCancelButton: true,
                    confirmButtonColor: '#2563EB'
                });

                if (email) {
                    try {
                        await AuthService.resetPassword(email);
                        Swal.fire('¡Enviado!', 'Revisa tu correo para restablecer tu contraseña.', 'success');
                    } catch (error) {
                        Swal.fire('Error', error.message, 'error');
                    }
                }
            });
        }
    }
};
