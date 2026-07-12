// api/progress.js
export default async function handler(req, res) {
    const { progressId } = req.query;
    const API_KEY = 'd34fae19f9mshabcb085f9847622p12881cjsn960d55f8645b';
    const API_HOST = 'youtube-mp4-mp3-downloader.p.rapidapi.com';

    const url = `https://${API_HOST}/api/v1/progress?id=${progressId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST
            }
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar progreso' });
    }
}