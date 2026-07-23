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

// SOLUCIÓN AL REPRODUCTOR NEGRO: Descarga directa (Blob)
async function forzarDescarga(url, nombreArchivo) {
    const statusText = document.getElementById('statusText');
    statusText.innerText = "Transfiriendo archivo, por favor espera...";
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
        statusText.innerText = "¡Descarga completada!";
    } catch (e) {
        // Si falla (por seguridad del navegador), lo abre normal
        window.open(url, '_blank');
        statusText.innerText = "¡Listo!";
    }
}

async function procesarDescarga() {
    const urlInput = document.getElementById('urlInput').value;
    const vQ = document.getElementById('videoQuality').value;
    const aQ = document.getElementById('audioQuality').value;
    const videoId = extraerIdYoutube(urlInput);

    if (!videoId) return alert("Por favor, ingresa una url válida.");

    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    statusText.innerText = "Conectando con el servidor...";

    try {
        const format = currentMode === 'audio' ? 'mp3' : vQ;
        
        // AQUÍ ENVIAMOS LA CALIDAD (Lo que faltó en la versión corta)
        const res = await fetch(`/api/download?id=${videoId}&format=${format}&audioQuality=${aQ}`);
        const data = await res.json();

        if (data.progressId) {
            let completado = false;
            let checks = 0;

            // Bucle de paciencia (hasta 30 minutos de espera)
            while (!completado && checks < 600) {
                checks++;
                const resProg = await fetch(`/api/progress?progressId=${data.progressId}`);
                const prog = await resProg.json();
                
                if (prog.progress) {
                    let porcentaje = Math.floor(prog.progress / 10);
                    statusText.innerText = `Procesando conversión: ${porcentaje > 100 ? 100 : porcentaje}% completado...`;
                } else {
                    statusText.innerText = `Preparando servidor... (intento ${checks})`;
                }

                const link = prog.downloadUrl || prog.url || prog.link || (prog.data && prog.data.url);

                if (link && link !== "") {
                    completado = true;
                    statusText.innerText = "¡Conversión finalizada!";
                    
                    const extension = currentMode === 'audio' ? '.mp3' : '.mp4';
                    const nombreFinal = `YT_${videoId}${extension}`;

                    resultArea.innerHTML = `
                        <div class="space-y-4">
                            <button onclick="forzarDescarga('${link}', '${nombreFinal}')" 
                                class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95">
                                Descargar archivo ahora
                            </button>
                            <button onclick="location.reload()" class="w-full mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60">Nueva descarga</button>
                        </div>
                    `;
                    resultArea.classList.remove('hidden');
                } else {
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        } else {
            statusText.innerText = "Error: La API no inició el proceso.";
        }
    } catch (e) {
        statusText.innerText = "Error de conexión. Intenta de nuevo.";
    } finally {
        loadingArea.classList.add('hidden');
    }
}