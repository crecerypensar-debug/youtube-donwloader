export default async function handler(req, res) {
    const { id } = req.query;
    const API_KEY = 'd34fae19f9mshabcb085f9847622p12881cjsn960d55f8645b';
    const API_HOST = 'youtube-media-downloader.p.rapidapi.com';

    // Este endpoint devuelve todos los formatos disponibles de una vez
    const url = `https://${API_HOST}/v2/video/details?videoId=${id}`;

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
        res.status(500).json({ error: 'Error de servidor' });
    }
}