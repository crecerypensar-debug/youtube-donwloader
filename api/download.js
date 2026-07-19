export default async function handler(req, res) {
    const { id, format, audioQuality } = req.query;
    const API_KEY = 'd34fae19f9mshabcb085f9847622p12881cjsn960d55f8645b';
    const API_HOST = 'youtube-mp4-mp3-downloader.p.rapidapi.com';

    // REFUERZO: Forzamos que audioQuality sea un número y no un texto
    const qualityNum = parseInt(audioQuality);

    // Intentamos cambiar la estructura de la URL para ver si la API responde mejor
    const url = `https://${API_HOST}/api/v1/download?format=${format}&id=${id}&audioQuality=${qualityNum}&addInfo=false&allowExtendedDuration=true`;

    try {
        const response = await fetch(url, {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST
            }
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
}