export default async function handler(req, res) {
    const { id, format, audioQuality } = req.query;
    const API_KEY = 'd34fae19f9mshabcb085f9847622p12881cjsn960d55f8645b';
    const API_HOST = 'youtube-mp3-audio-video-downloader.p.rapidapi.com';

    // Spicy-Laika usa 'type' (audio/video) y 'quality'
    const type = format === 'mp3' ? 'audio' : 'video';
    const quality = format === 'mp3' ? audioQuality : format;

    const url = `https://${API_HOST}/v2/download?id=${id}&type=${type}&quality=${quality}`;

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