let currentMode = 'video';

function switchTab(mode) {
    currentMode = mode;
    document.getElementById('videoOptions').classList.toggle('hidden', mode === 'audio');
    document.getElementById('audioOptions').classList.toggle('hidden', mode === 'video');
    document.getElementById('tabVideo').className = mode === 'video' ? 'flex-1 py-3 text-sm font-bold tab-active tracking-wide' : 'flex-1 py-3 text-sm font-bold text-slate-500 tracking-wide';
    document.getElementById('tabAudio').className = mode === 'audio' ? 'flex-1 py-3 text-sm font-bold tab-active tracking-wide' : 'flex-1 py-3 text-sm font-bold text-slate-500 tracking-wide';
}

function extraerIdYoutube(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function procesarDescarga() {
    const url = document.getElementById('urlInput').value;
    const vQ = document.getElementById('videoQuality').value;
    const aQ = document.getElementById('audioQuality').value;
    const videoId = extraerIdYoutube(url);

    if (!videoId) return alert("Por favor, pega un enlace válido.");

    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const statusText = document.getElementById('statusText');

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    resultArea.innerHTML = '';

    try {
        const format = currentMode === 'audio' ? 'mp3' : vQ;
        statusText.innerText = "Solicitando video a los servidores...";
        
        const response = await fetch(`/api/download?id=${videoId}&format=${format}&audioQuality=${aQ}`);
        const data = await response.json();

        if (data.progressId) {
            let completado = false;
            let checks = 0;

            while (!completado && checks < 400) {
                checks++;
                const res = await fetch(`/api/progress?progressId=${data.progressId}`);
                const prog = await res.json();
                
                console.log("Estado de la API:", prog); // Muy importante ver esto en consola

                if (prog.progress) {
                    let porcentaje = Math.floor(prog.progress / 10);
                    if (porcentaje > 100) porcentaje = 100;
                    statusText.innerText = `Procesando: ${porcentaje}% completado...`;
                } else {
                    statusText.innerText = `Preparando archivo... (Intento ${checks})`;
                }

                // BUSCADOR DE ENLACES AGRESIVO:
                // Buscamos en todas las propiedades posibles donde la API suele esconder el link
                const link = prog.downloadUrl || prog.url || prog.link || (prog.data && prog.data.url) || prog.file;

                if (link && link !== "") {
                    statusText.innerText = "¡Conversión finalizada!";
                    resultArea.innerHTML = `
                        <div class="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                            <a href="${link}" target="_blank" class="block bg-slate-950 text-white text-center font-bold py-4 rounded-[calc(1rem-2px)] hover:bg-slate-900 transition-all tracking-wide">
                                Descargar archivo final
                            </a>
                        </div>
                        <button onclick="location.reload()" class="w-full mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity">Descargar otro video</button>
                    `;
                    resultArea.classList.remove('hidden');
                    completado = true;
                } else {
                    // Si el progreso es 1000 (100%) pero no hay link, esperamos un poco más
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }
    } catch (e) {
        statusText.innerText = "Error de conexión. Intenta de nuevo.";
    } finally {
        loadingArea.classList.add('hidden');
    }
}