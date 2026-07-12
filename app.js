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
        
        // 1. Pedir inicio de descarga
        const response = await fetch(`/api/download?id=${videoId}&format=${formato}`);
        const data = await response.json();
        console.log("Respuesta Inicial (Ticket):", data);

        if (data.progressId) {
            let descargado = false;
            let intentos = 0;
            const maxIntentos = 40; // 2 minutos aprox.

            while (!descargado && intentos < maxIntentos) {
                intentos++;
                
                const resProgreso = await fetch(`/api/progress?progressId=${data.progressId}`);
                const dataProgreso = await resProgreso.json();
                
                // --- ESTO ES LO MÁS IMPORTANTE PARA EL INGENIERO ---
                console.log(`Intento ${intentos} - Respuesta Completa:`, dataProgreso);

                // Intentamos capturar el link en cualquier variante posible que use la API
                const linkFinal = 
                    dataProgreso.url || 
                    dataProgreso.link || 
                    dataProgreso.download || 
                    dataProgreso.downloadUrl ||
                    (dataProgreso.data && dataProgreso.data.url);

                if (linkFinal) {
                    console.log("¡ENLACE ENCONTRADO!", linkFinal);
                    resultArea.innerHTML = `
                        <a href="${linkFinal}" target="_blank" rel="noopener noreferrer" 
                           class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-500/40 w-full">
                           ⬇️ Descargar ${tipo === 'video' ? 'Video' : 'Audio'}
                        </a>
                    `;
                    resultArea.classList.remove('hidden');
                    descargado = true;
                } else {
                    // Si la API nos dice explícitamente que falló
                    if (dataProgreso.status === 'error' || dataProgreso.success === false) {
                        alert("La API reportó un error: " + (dataProgreso.msg || "Video no soportado"));
                        break;
                    }
                    // Esperar 3 segundos para el siguiente intento
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            if (!descargado && intentos >= maxIntentos) {
                alert("Tiempo de espera agotado. Mira la consola para ver qué respondió la API.");
            }
        } else {
            alert("No se recibió un ID de progreso. Revisa la consola.");
        }

    } catch (error) {
        console.error("Error técnico:", error);
        alert('Error de conexión con el servidor.');
    } finally {
        loadingArea.classList.add('hidden');
    }
}
