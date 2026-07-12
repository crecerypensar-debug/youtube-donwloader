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
        const formato = (tipo === 'video') ? '720' : 'mp3';
        
        // Ahora llamamos a nuestra propia API interna de Vercel
        // No hay CORS porque Vercel habla con RapidAPI de servidor a servidor
        const response = await fetch(`/api/download?id=${videoId}&format=${formato}`);
        const data = await response.json();

        console.log("Respuesta recibida:", data);

        const linkFinal = data.url || data.link || (data.data && data.data.url) || data.downloadUrl;

        if (linkFinal) {
            resultArea.innerHTML = `
                <a href="${linkFinal}" target="_blank" rel="noopener noreferrer" 
                   class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-500/40 w-full">
                   ⬇️ Descargar ${tipo === 'video' ? 'Video' : 'Audio'}
                </a>
            `;
            resultArea.classList.remove('hidden');
        } else {
            throw new Error('No se obtuvo link');
        }

    } catch (error) {
        console.error(error);
        alert('Error al procesar el video. Intenta de nuevo.');
    } finally {
        loadingArea.classList.add('hidden');
    }
}
