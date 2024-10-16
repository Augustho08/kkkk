let notificationCount = 0;

function createAndShowNotification(message) {
    return new Promise((resolve) => {
        if (document.getElementById('notification-styles') === null) {
            const e = document.createElement("style");
            e.id = 'notification-styles';
            e.innerHTML = `
                .notification {
                    position: fixed;
                    right: -320px;
                    background-color: #333;
                    color: #fff;
                    padding: 10px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    width: 320px;
                    height: 60px;
                    transition: right 0.5s ease;
                }
                .notification-content {
                    position: relative;
                    height: 100%;
                }
                .close-btn {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    cursor: pointer;
                    font-size: 20px;
                }
                .notification-content p {
                    margin: 0;
                }
                .progress-bar {
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                    height: 5px;
                    background-color: #555;
                    border-radius: 5px;
                    width: 90%;
                    overflow: hidden;
                }
                .progress-bar div {
                    height: 100%;
                    background-color: #bbb;
                    width: 100%;
                    animation: progress 5s linear forwards;
                }
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0;
                    }
                }
            `;
            document.head.appendChild(e);
        }

        notificationCount++;

        const t = document.createElement("div");
        t.id = `notification-${notificationCount}`; 
        t.className = "notification";
        t.style.bottom = `${20 + (notificationCount - 1) * 70}px`; 
        t.style.right = "20px";
        t.innerHTML = `
            <div class="notification-content">
                <span id="close-btn-${notificationCount}" class="close-btn">&times;</span>
                <p>${message}</p>
                <div class="progress-bar"><div></div></div>
            </div>
        `;
        document.body.appendChild(t);

        const n = document.getElementById(`close-btn-${notificationCount}`);

        n.onclick = function() {
            hideNotification(t, resolve);
        };

        setTimeout(() => {
            t.style.right = "20px"; 
        }, 10);

        setTimeout(() => {
            hideNotification(t, resolve);
        }, 5000);
    });
}

function hideNotification(notificationElement, resolve) {
    notificationElement.style.right = "-300px";
    setTimeout(() => {
        notificationElement.style.display = "none";
        notificationCount--; 
        resolve(); 
    }, 500);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processLessons(ra, password, damn, lessonType) {
    if (!ra || !password) {
        document.getElementById('name').value = '';
        document.getElementById('password').value = '';
        return alert('Preencha os dados corretamente!');
    }
    
    createAndShowNotification("PEGANDO INFORMAÇÕES...");

    const raEncoded = encodeURIComponent(ra);
    const passwordEncoded = encodeURIComponent(password);

    const pre_getinfo_response = await fetch(`https://cmsp-cheeto-v2.vercel.app/getporra?ra=${raEncoded}&password=${passwordEncoded}&porra=${damn}`);
    if (!pre_getinfo_response.ok) {
        createAndShowNotification('Erro ao entrar na conta. Tente novamente.');
        return;
    }

    const getinfo_response = await pre_getinfo_response.json(); 
    if (!getinfo_response.x_auth_key || !getinfo_response.room_code) {
        createAndShowNotification('Erro ao carregar informações.');
        return;
    }

    const x_auth_key = getinfo_response.x_auth_key;
    const room_code = getinfo_response.room_code;

    let getlessons_url = lessonType === 'normal' 
        ? `https://cmsp-cheeto-v2.vercel.app/getlesson_normal?x_auth_key=${x_auth_key}&room_code=${room_code}&porra=${damn}` 
        : `https://cmsp-cheeto-v2.vercel.app/getlesson_expired?x_auth_key=${x_auth_key}&room_code=${room_code}&porra=${damn}`;

    let getlessons_response = await fetch(getlessons_url);
    if (!getlessons_response.ok) {
        createAndShowNotification('Erro ao carregar lições. Verifique sua conexão.');
        return;
    }

    const lessons = await getlessons_response.text();
    if (lessons === '[]') {
        createAndShowNotification("Nenhuma Lição Encontrada.");
        return;
    }

    const catapimbas = JSON.parse(lessons); 
    for (const lesson of catapimbas) {
        const titleUpper = lesson.title.toUpperCase();
        if (["PROVA PAULISTA", "SARESP", "RECUPERAÇÃO", "REDAÇÃO"].some(exclude => titleUpper.includes(exclude))) {
            createAndShowNotification(`Ignorando a ATIVIDADE: ${lesson.title}`);
            continue;
        }

        createAndShowNotification(`FAZENDO LIÇÃO ${lesson.title}`);
        await delay(1000);

        try {
            const dolesson_response = await fetch(`https://cmsp-cheeto-v2.vercel.app/dolesso?x_auth_key=${x_auth_key}&room_code=${room_code}&lesson_id=${lesson.id}&porra=${damn}`);
            if (!dolesson_response.ok) {
                createAndShowNotification(`Erro ao fazer a atividade ${lesson.title}.`);
            }
        } catch (
