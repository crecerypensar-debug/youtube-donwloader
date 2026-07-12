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

    // Mostrar UI de carga
    loadingArea.classList.remove('hidden');
    resultArea.classList.add('hidden');
    resultArea.innerHTML = '';

    try {
        // Formato: 720 (video) o mp3 (audio)
        const formato = (tipo === 'video') ? '720' : 'mp3';
        
        // URL exacta del EndPoint de Opachi
        // Agregamos un proxy gratuito para saltar el bloqueo de seguridad (CORS)
const peticionUrl = `https://corsproxy.io/?${encodeURIComponent(`https://${API_HOST}/api/v1/download?format=${formato}&id=${videoId}&audioQuality=128&addInfo=false&allowExtendedDuration=false`)}`;

        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST
            }
        };

        const response = await fetch(peticionUrl, options);
        const data = await response.json();

        console.log("Respuesta de RapidAPI:", data);

        // La API de Opachi suele devolver el link en data.url o data.download
        const linkFinal = data.url || data.link || (data.data && data.data.url) || data.downloadUrl;

        if (linkFinal) {
            resultArea.innerHTML = `
                <a href="${linkFinal}" target="_blank" rel="noopener noreferrer" 
                   class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-500/40 w-full">
                   ⬇️ Descargar ${tipo === 'video' ? 'Video' : 'Audio'}
                </a>
                <p class="text-xs text-slate-400 mt-3">Si no descarga automáticamente, haz clic en el botón de los 3 puntos del reproductor y dale a "Descargar".</p>
            `;
            resultArea.classList.remove('hidden');
        } else {
            throw new Error('La API no devolvió el enlace. Revisa la consola.');
        }

    } catch (error) {
        console.error(error);
        alert('Hubo un error al procesar el video. Puede ser restricción de la API o del video (copyright).');
    } finally {
        loadingArea.classList.add('hidden');
    }
}
