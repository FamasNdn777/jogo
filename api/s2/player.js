const { cors, headers, axios, cheerio } = require('../_utils');
module.exports = async (req, res) => {
    cors(res);
    const link = req.query.link;
    if (!link) return res.status(400).json({ erro: 'Parâmetro "link" é obrigatório' });
    try {
        const { data } = await axios.get(link, { headers, timeout: 15000 });
        const $ = cheerio.load(data);
        let sources = [];
        let iframe = '';
        const iframeSrc = $('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"], .playex iframe, #playex iframe, .dooplay_player iframe').first().attr('src') || '';
        if (iframeSrc) iframe = iframeSrc.startsWith('http') ? iframeSrc : 'https:' + iframeSrc;
        $('video source, source[src*=".mp4"], source[src*=".m3u8"]').each((i, el) => {
            const src = $(el).attr('src');
            const label = $(el).attr('label') || $(el).attr('size') || 'Fonte ' + (i + 1);
            if (src) sources.push({ url: src, label, quality: label });
        });
        res.json({ sources, iframe });
    } catch (e) { res.status(500).json({ erro: "Erro ao buscar player do episódio" }); }
};
