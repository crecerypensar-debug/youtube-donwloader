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
    const urlInput = document.getElementById('urlInput').value;
    const vQ = document.getElementById('videoQuality').value;
    const videoId = extraerIdYoutube(urlInput);

    if (!videoId) return alert("Por favor, ingresa una url válida.");

    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    resultArea.innerHTML = '';
    statusText.innerText = "Conectando con servidores de Google...";

    try {
        const response = await fetch(`/api/download?id=${videoId}`);
        const data = await response.json();

        let enlaceFinal = null;
        let info = "";

        if (currentMode === 'video') {
            const listaVideos = data.videos?.items || [];
            // Buscamos el video pedido que tenga audio
            let match = listaVideos.find(v => v.quality === vQ + 'p' && v.hasAudio);
            
            if (!match) {
                // Si no hay el exacto con audio (común en 1080p), buscamos el mejor disponible con audio
                match = listaVideos.filter(v => v.hasAudio).sort((a,b) => b.width - a.width)[0];
                info = `Calidad real: ${match?.quality} (con audio)`;
            } else {
                info = `Calidad real: ${vQ}p HD`;
            }
            enlaceFinal = match?.url;
        } else {
            // Buscamos el stream de audio con mayor bitrate
            const listaAudios = data.audios?.items || [];
            const mejorAudio = listaAudios.sort((a,b) => b.bitrate - a.bitrate)[0];
            enlaceFinal = mejorAudio?.url;
            info = `Audio extraído a ${Math.floor(mejorAudio?.bitrate / 1000)} kbps`;
        }

        if (enlaceFinal) {
            statusText.innerText = "¡Enlace extraído con éxito!";
            resultArea.innerHTML = `
                <div class="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <a href="${enlaceFinal}" target="_blank" download class="block bg-slate-950 text-white text-center font-bold py-4 rounded-[calc(1rem-2px)] hover:bg-slate-900 transition-all">
                        Descargar archivo real
                    </a>
                </div>
                <p class="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest font-bold opacity-60">${info}</p>
                <button onclick="location.reload()" class="w-full mt-4 text-[10px] text-slate-400 underline">Nueva descarga</button>
            `;
            resultArea.classList.remove('hidden');
        } else {
            alert("No se encontró un archivo compatible para este video.");
        }
    } catch (e) {
        statusText.innerText = "Error o límite de API alcanzado.";
    } finally {
        loadingArea.classList.add('hidden');
    }
}