// --- CONFIGURACIÓN DE TU API (OPACHI) ---
const API_KEY = 'd34fae19f9mshabcb085f9847622p12881cjsn960d55f8645b'; 
const API_HOST = 'youtube-mp4-mp3-downloader.p.rapidapi.com';

// 1. Interceptar el "Compartir" de Android (Web Share Target)
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    
    if (sharedUrl && (sharedUrl.includes('youtube.com') || sharedUrl.includes('youtu.be'))) {
        const regex = /(https?:\/\/[^\s]+)/g;
        const urls = sharedUrl.match(regex);
        if (urls && urls.length > 0) {
            document.getElementById('urlInput').value = urls[0];
        }
    }
});

// 2. Extraer el ID exacto del video (las 11 letras)
function extraerIdYoutube(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// 3. Función Principal de Petición
async function descargarMedia(tipo) {
    const urlInput = document.getElementById('urlInput').value;
    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');

    const videoId = extraerIdYoutube(urlInput);
    if (!videoId) {
        alert('Por favor, ingresa una URL válida de YouTube.');
        return;
    }

    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    resultArea.innerHTML = '';

    try {
        const formato = (tipo === 'video') ? '720' : 'mp3';
        const response = await fetch(`/api/download?id=${videoId}&format=${formato}`);
        const data = await response.json();

        if (data.progressId) {
            let descargado = false;
            let intentos = 0;
            // Aumentamos a 100 intentos (aprox. 5 minutos de espera)
            const maxIntentos = 100; 

            while (!descargado && intentos < maxIntentos) {
                intentos++;
                
                const resProgreso = await fetch(`/api/progress?progressId=${data.progressId}`);
                const dataProgreso = await resProgreso.json();
                
                // IMPORTANTE: Mira la consola para ver qué responde la API
                console.log("Estado actual:", dataProgreso);

                // Verificamos si ya hay un link de descarga
                const linkFinal = dataProgreso.url || dataProgreso.link || (dataProgreso.data && dataProgreso.data.url) || dataProgreso.download;

                if (linkFinal) {
                    resultArea.innerHTML = `
                        <a href="${linkFinal}" target="_blank" rel="noopener noreferrer" 
                           class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-500/40 w-full">
                           ⬇️ Descargar ${tipo === 'video' ? 'Video' : 'Audio'}
                        </a>
                    `;
                    resultArea.classList.remove('hidden');
                    descargado = true;
                } else {
                    // Si la API dice que hay error o falló, paramos
                    if (dataProgreso.status === 'error' || dataProgreso.error) {
                        alert("La API no puede procesar este video (posiblemente es demasiado largo o tiene copyright).");
                        break;
                    }
                    // Esperar 3 segundos para no saturar
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            if (!descargado && intentos >= maxIntentos) alert("El video es muy pesado y sigue procesándose. Intenta con uno más corto.");
        }

    } catch (error) {
        console.error(error);
        alert('Error de conexión. Intenta de nuevo.');
    } finally {
        loadingArea.classList.add('hidden');
    }
}
