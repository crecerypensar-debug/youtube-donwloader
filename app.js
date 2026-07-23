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

// MAGIA TÉCNICA: Descarga el archivo sin abrir nuevas pestañas
async function forzarDescarga(url, nombreArchivo) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = urlBlob;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(urlBlob);
    } catch (e) {
        // Si el archivo es demasiado grande (>100MB), el navegador podría fallar con blobs. 
        // En ese caso, abrimos en pestaña nueva como respaldo.
        window.open(url, '_blank');
    }
}

async function procesarDescarga() {
    const urlInput = document.getElementById('urlInput').value;
    const vQ = document.getElementById('videoQuality').value;
    const aQ = document.getElementById('audioQuality').value;
    const videoId = extraerIdYoutube(urlInput);

    if (!videoId) return alert("URL no válida");

    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');

    try {
        const format = currentMode === 'audio' ? 'mp3' : vQ;
        statusText.innerText = `Convirtiendo a ${currentMode === 'audio' ? aQ + 'kbps' : vQ + 'p'}...`;

        const response = await fetch(`/api/download?id=${videoId}&format=${format}&audioQuality=${aQ}`);
        const data = await response.json();

        // Esta API suele devolver el link en data.result o data.link
        const enlaceFinal = data.result || data.link || data.download;

        if (enlaceFinal) {
            statusText.innerText = "¡Conversión exitosa!";
            
            // Creamos un nombre amigable para el archivo
            const extension = currentMode === 'audio' ? '.mp3' : '.mp4';
            const nombreFinal = `YT_Download_${videoId}${extension}`;

            resultArea.innerHTML = `
                <div class="space-y-4">
                    <button onclick="descargarAhora('${enlaceFinal}', '${nombreFinal}')" 
                        class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all uppercase tracking-tighter">
                        ⬇️ Guardar en mi dispositivo
                    </button>
                    <p class="text-[10px] text-slate-500 uppercase font-bold text-center italic">
                        Formato: ${extension.toUpperCase()} | Calidad: ${currentMode === 'audio' ? aQ + 'kbps' : vQ + 'p'}
                    </p>
                </div>
            `;
            resultArea.classList.remove('hidden');
        }
    } catch (e) {
        statusText.innerText = "Error. Verifica el plan de tu API.";
    } finally {
        loadingArea.classList.add('hidden');
    }
}

// Función que llama a la descarga forzada
function descargarAhora(url, nombre) {
    const statusText = document.getElementById('statusText');
    const loadingArea = document.getElementById('loadingArea');
    
    loadingArea.classList.remove('hidden');
    statusText.innerText = "Iniciando transferencia al dispositivo...";
    
    forzarDescarga(url, nombre).then(() => {
        loadingArea.classList.add('hidden');
        statusText.innerText = "¡Descarga completada!";
    });
}