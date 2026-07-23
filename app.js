let currentMode = 'video';

function switchTab(mode) {
    currentMode = mode;
    document.getElementById('videoOptions').classList.toggle('hidden', mode === 'audio');
    document.getElementById('audioOptions').classList.toggle('hidden', mode === 'video');
    document.getElementById('tabVideo').className = mode === 'video' ? 'flex-1 py-3 text-sm font-bold tab-active' : 'flex-1 py-3 text-sm font-bold text-slate-500';
    document.getElementById('tabAudio').className = mode === 'audio' ? 'flex-1 py-3 text-sm font-bold tab-active' : 'flex-1 py-3 text-sm font-bold text-slate-500';
}

function extraerIdYoutube(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function procesarDescarga() {
    console.log("Botón presionado...");
    const urlInput = document.getElementById('urlInput').value;
    const vQ = document.getElementById('videoQuality').value;
    const aQ = document.getElementById('audioQuality').value;
    const videoId = extraerIdYoutube(urlInput);

    if (!videoId) {
        alert("Enlace no válido.");
        return;
    }

    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    statusText.innerText = "Conectando con el servidor...";

    try {
        const format = currentMode === 'audio' ? 'mp3' : vQ;
        console.log(`Solicitando ${currentMode} calidad ${format}...`);

        const response = await fetch(`/api/download?id=${videoId}&format=${format}&audioQuality=${aQ}`);
        const data = await response.json();
        
        console.log("Respuesta recibida:", data);

        // La API Spicy-Laika suele devolver el link en 'result' o 'link'
        const enlaceFinal = data.result || data.link || data.download;

        if (enlaceFinal) {
            statusText.innerText = "¡Conversión finalizada!";
            resultArea.innerHTML = `
                <div class="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                    <a href="${enlaceFinal}" target="_blank" download class="block bg-slate-950 text-white text-center font-bold py-4 rounded-[calc(1rem-2px)] hover:bg-slate-900 transition-all">
                        Guardar archivo
                    </a>
                </div>
                <button onclick="location.reload()" class="w-full mt-4 text-[10px] text-slate-500 uppercase font-bold opacity-60">Nueva descarga</button>
            `;
            resultArea.classList.remove('hidden');
        } else {
            throw new Error("No se encontró enlace en la respuesta");
        }
    } catch (e) {
        console.error("Error técnico:", e);
        statusText.innerText = "Error. Intenta con otro video o calidad.";
    } finally {
        loadingArea.classList.add('hidden');
    }
}