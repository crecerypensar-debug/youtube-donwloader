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
    const vQ = document.getElementById('videoQuality').value; // Ej: 360, 720, 1080
    const aQ = parseInt(document.getElementById('audioQuality').value); // Ej: 128, 192, 320
    const videoId = extraerIdYoutube(urlInput);

    if (!videoId) return alert("Por favor, ingresa una url válida.");

    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    resultArea.innerHTML = '';
    statusText.innerText = "Analizando archivos disponibles...";

    try {
        const response = await fetch(`/api/download?id=${videoId}`);
        const data = await response.json();

        let enlaceFinal = null;
        let info = "";

        if (currentMode === 'video') {
            const videos = data.videos?.items || [];
            // FILTRADO ESTRICTO: Buscamos exactamente la resolución pedida
            let match = videos.find(v => v.quality === vQ + 'p' && v.hasAudio);
            
            if (!match) {
                // Si no hay el pedido, buscamos el más cercano disponible con audio
                match = videos.filter(v => v.hasAudio).sort((a,b) => b.width - a.width)[0];
                info = `Calidad original ajustada a ${match?.quality}`;
            } else {
                info = `Resolución original: ${vQ}p`;
            }
            enlaceFinal = match?.url;

        } else {
            const audios = data.audios?.items || [];
            // YouTube suele tener bitrates de aprox 64000, 128000 y 160000.
            // Convertimos tu selección (ej 128) a formato de la API (128000)
            const targetBitrate = aQ * 1000;

            // LÓGICA DE FILTRADO: Buscamos el audio cuyo bitrate sea el más cercano al pedido
            const match = audios.sort((a, b) => {
                return Math.abs(a.bitrate - targetBitrate) - Math.abs(b.bitrate - targetBitrate);
            })[0];

            enlaceFinal = match?.url;
            info = `Audio real extraído: ${Math.floor(match?.bitrate / 1000)} kbps`;
        }

        if (enlaceFinal) {
            statusText.innerText = "¡Archivo encontrado!";
            resultArea.innerHTML = `
                <div class="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <a href="${enlaceFinal}" target="_blank" class="block bg-slate-950 text-white text-center font-bold py-4 rounded-[calc(1rem-2px)] hover:bg-slate-900 transition-all">
                        Descargar archivo real
                    </a>
                </div>
                <p class="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-tighter italic font-bold opacity-70">${info}</p>
                <button onclick="location.reload()" class="w-full mt-4 text-[10px] text-slate-400 underline">Nueva descarga</button>
            `;
            resultArea.classList.remove('hidden');
        } else {
            alert("No se encontró un formato compatible.");
        }
    } catch (e) {
        statusText.innerText = "Error o límite de API alcanzado.";
    } finally {
        loadingArea.classList.add('hidden');
    }
}