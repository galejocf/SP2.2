// NUEVA CLAVE API OPENROUTER
const OPENROUTER_API_KEY = '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';

// LISTA DE MODELOS GRATUITOS PARA TESTEAR (Se agregó apodex-mini como primero)
const FREE_MODELS = [
    "apodex/apodex-1.1-mini:free",
    "mistralai/mistral-7b-instruct:free",
    "meta-llama/llama-3-8b-instruct:free",
    "google/gemma-2-9b-it:free",
    "openchat/openchat-7b:free",
    "qwen/qwen-2-7b-instruct:free"
];

const state = {
    cardData: {
        name: '',
        bio: '',
        avatarUrl: 'src/assets/Avatares0.png',
        color: '#3b82f6'
    },
    chatHistory: [],
    chatInitialized: false
};

/** REFERENCIAS AL DOM **/
const dom = {
    navCreate: document.getElementById('nav-create'),
    navChat: document.getElementById('nav-chat'),
    viewCreate: document.getElementById('view-create'),
    viewChat: document.getElementById('view-chat'),
    inputName: document.getElementById('input-name'),
    inputBio: document.getElementById('input-bio'),
    inputColor: document.getElementById('input-color'),
    inputSearch: document.getElementById('github-search'),
    btnFetch: document.getElementById('btn-fetch'),
    apiStatus: document.getElementById('api-status'),
    form: document.getElementById('profile-form'),
    saveStatus: document.getElementById('save-status'),
    avatarSelector: document.getElementById('avatar-selector'),
    previewName: document.getElementById('name-preview'),
    previewBio: document.getElementById('bio-preview'),
    previewAvatar: document.getElementById('avatar-preview'),
    previewHeader: document.getElementById('preview-header'),
    chatUserName: document.getElementById('chat-user-name'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat')
};

/** MANEJO DE VISTAS **/
const switchView = (viewName) => {
    if (viewName === 'create') {
        dom.navCreate.classList.add('active');
        dom.navChat.classList.remove('active');
        dom.viewCreate.classList.add('active');
        dom.viewChat.classList.remove('active');
    } else if (viewName === 'chat') {
        dom.navChat.classList.add('active');
        dom.navCreate.classList.remove('active');
        dom.viewChat.classList.add('active');
        dom.viewCreate.classList.remove('active');
        
        if (state.cardData.name && !state.chatInitialized) {
            initChat();
        }
    }
};

/** SELECTOR DE AVATARES **/
const initAvatarSelector = () => {
    const totalAvatares = 5;
    for (let i = 0; i < totalAvatares; i++) {
        const rutaImagen = `src/assets/Avatares${i}.png`;
        const img = document.createElement('img');
        img.src = rutaImagen;
        img.alt = `Avatar ${i}`;
        img.className = 'avatar-option';
        img.dataset.url = rutaImagen;

        img.addEventListener('click', () => {
            state.cardData.avatarUrl = rutaImagen;
            renderCard();
        });
        dom.avatarSelector.appendChild(img);
    }
};

/** RENDERIZADO DEL PERFIL **/
const renderCard = () => {
    dom.previewName.textContent = state.cardData.name || 'Nombre Apellido';
    dom.previewBio.textContent = state.cardData.bio || 'La biografía aparecerá aquí...';
    dom.previewAvatar.src = state.cardData.avatarUrl;
    dom.previewHeader.style.backgroundColor = state.cardData.color;

    dom.inputName.value = state.cardData.name;
    dom.inputBio.value = state.cardData.bio;
    dom.inputColor.value = state.cardData.color;

    const avatares = dom.avatarSelector.querySelectorAll('.avatar-option');
    avatares.forEach((img) => {
        if (img.dataset.url === state.cardData.avatarUrl) {
            img.classList.add('selected');
        } else {
            img.classList.remove('selected');
        }
    });
};

/** API DE GITHUB **/
const fetchGitHubData = async (username) => {
    if (!username) {
        dom.apiStatus.textContent = 'Ingresa un usuario de GitHub.';
        dom.apiStatus.className = 'status-msg status-error';
        return;
    }

    dom.apiStatus.textContent = 'Buscando en GitHub...';
    dom.apiStatus.className = 'status-msg status-loading';
    dom.btnFetch.disabled = true;

    try {
        const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
        if (response.status === 404) throw new Error('Usuario no encontrado.');
        if (!response.ok) throw new Error('Error al obtener datos.');

        const data = await response.json();
        state.cardData.name = data.name || data.login;
        state.cardData.bio = data.bio || '';
        state.cardData.avatarUrl = data.avatar_url;

        renderCard();
        dom.apiStatus.textContent = '¡Datos de GitHub cargados!';
        dom.apiStatus.className = 'status-msg status-success';
    } catch (error) {
        dom.apiStatus.textContent = error.message;
        dom.apiStatus.className = 'status-msg status-error';
    } finally {
        dom.btnFetch.disabled = false;
    }
};

/** INICIALIZAR CHAT **/
const initChat = () => {
    state.chatInitialized = true;
    dom.chatUserName.textContent = state.cardData.name;
    
    dom.chatInput.disabled = false;
    dom.btnSendChat.disabled = false;

    const systemPrompt = `Eres un asistente de IA amigable y servicial. Estás hablando con un usuario que acaba de crear su perfil en nuestra app.
    Información del usuario: Su nombre es "${state.cardData.name}" y su biografía es "${state.cardData.bio || 'No especificada'}".
    Saluda al usuario por su nombre de forma cálida en tu primer mensaje. Responde en español, sé conciso y amigable.`;

    state.chatHistory = [{ role: "system", content: systemPrompt }];
    dom.chatMessages.innerHTML = '';
    fetchAIResponse();
};

const appendMessage = (text, sender) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'msg-user' : 'msg-ai');
    msgDiv.textContent = text;
    dom.chatMessages.appendChild(msgDiv);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
};

/** FETCH IA CON FALLBACK MULTI-MODELO **/
const fetchAIResponse = async () => {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'msg-ai');
    typingDiv.id = 'typing-indicator';
    typingDiv.textContent = 'Escribiendo...';
    dom.chatMessages.appendChild(typingDiv);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;

    dom.chatInput.disabled = true;
    dom.btnSendChat.disabled = true;

    let success = false;
    let aiText = "";

    // Bucle para probar cada modelo de la lista hasta que uno funcione
    for (const model of FREE_MODELS) {
        try {
            console.log(`Intentando conectar con el modelo: ${model}...`);
            
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.href, 
                    "X-Title": "Generador de Perfiles"
                },
                body: JSON.stringify({
                    "model": model,
                    "messages": state.chatHistory
                })
            });

            const data = await response.json();

            // Si el servidor responde con error (ej. 404, modelo inactivo, etc.)
            if (!response.ok) {
                console.warn(`[Fallo] El modelo ${model} no está disponible:`, data.error?.message || response.status);
                continue; // Saltamos al siguiente modelo del bucle
            }

            // Si la respuesta es válida y tiene contenido
            if (data.choices && data.choices.length > 0) {
                aiText = data.choices[0].message.content;
                success = true;
                console.log(`[Éxito] Respondió el modelo: ${model}`);
                break; // Rompemos el bucle porque ya conseguimos respuesta
            }

        } catch (error) {
            console.warn(`[Error de Red] Fallo al intentar con ${model}:`, error.message);
            // Continúa automáticamente al siguiente modelo
        }
    }

    // Limpiar indicador de escribiendo de forma segura
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();

    // Evaluar el resultado final después de probar todos los modelos
    if (success) {
        state.chatHistory.push({ role: "assistant", content: aiText });
        appendMessage(aiText, 'ai');
    } else {
        appendMessage("Lo siento, todos los servidores gratuitos están ocupados o inactivos en este momento. Intenta enviar tu mensaje de nuevo en unos minutos.", 'ai');
        console.error("Ningún modelo de la lista de fallback pudo procesar la solicitud.");
    }

    // Rehabilitar controles
    dom.chatInput.disabled = false;
    dom.btnSendChat.disabled = false;
    dom.chatInput.focus();
};

/** EVENTOS PRINCIPALES **/
const setupEvents = () => {
    dom.navCreate.addEventListener('click', () => switchView('create'));
    dom.navChat.addEventListener('click', () => switchView('chat'));

    dom.inputName.addEventListener('input', (e) => { state.cardData.name = e.target.value; renderCard(); });
    dom.inputBio.addEventListener('input', (e) => { state.cardData.bio = e.target.value; renderCard(); });
    dom.inputColor.addEventListener('input', (e) => { state.cardData.color = e.target.value; renderCard(); });

    dom.form.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('profileCard', JSON.stringify(state.cardData));
        state.chatInitialized = false; 
        switchView('chat'); 
    });

    dom.btnFetch.addEventListener('click', () => fetchGitHubData(dom.inputSearch.value.trim()));
    dom.inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); dom.btnFetch.click(); }
    });

    dom.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = dom.chatInput.value.trim();
        if (!userText) return;

        dom.chatInput.value = '';
        appendMessage(userText, 'user');
        
        state.chatHistory.push({ role: "user", content: userText });
        fetchAIResponse();
    });
};

/** ARRANQUE DE LA APP **/
document.addEventListener('DOMContentLoaded', () => {
    initAvatarSelector();
    setupEvents();
    
    const savedCard = localStorage.getItem('profileCard');
    if (savedCard) {
        state.cardData = { ...state.cardData, ...JSON.parse(savedCard) };
    }
    
    renderCard();
});