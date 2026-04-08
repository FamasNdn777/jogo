const { cors, axios, cheerio, headers } = require('./_utils');
module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const link = req.query.link;
    if (!link) return res.status(400).json({ erro: 'Parâmetro "link" é obrigatório' });

    try {
        const { data } = await axios.get(link, { headers, timeout: 10000 });
        const $ = cheerio.load(data);

        const videoEl = $('video#my-video, video.video-js, video[data-video-src]').first();
        const videoSrcUrl = videoEl.attr('data-video-src') || '';

        let sources = [];
        let iframe = '';

        if (videoSrcUrl) {
            try {
                const fullUrl = videoSrcUrl.startsWith('http') ? videoSrcUrl : 'https://animefire.io' + videoSrcUrl;
                const videoRes = await axios.get(fullUrl, {
                    headers: { ...headers, 'Referer': link, 'Accept': 'application/json, text/plain, */*' },
                    timeout: 10000
                });
                const vData = videoRes.data;
                if (vData && Array.isArray(vData.data)) {
                    sources = vData.data.map(s => ({
                        url: s.src || s.url || '',
                        label: s.label || s.quality || '',
                        quality: s.label || s.quality || ''
                    })).filter(s => s.url);
                } else if (vData && typeof vData === 'object' && vData.src) {
                    sources = [{ url: vData.src, label: 'Default', quality: 'Default' }];
                } else if (typeof vData === 'string') {
                    const urlMatches = vData.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) ||
                                       vData.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
                    sources = urlMatches.map((u, i) => ({ url: u, label: 'Fonte ' + (i + 1), quality: 'Fonte ' + (i + 1) }));
                }
            } catch (e2) { /* fallback */ }
        }

        if (sources.length === 0) {
            const iframeSrc = $('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"]').first().attr('src') || '';
            if (iframeSrc) iframe = iframeSrc.startsWith('http') ? iframeSrc : 'https:' + iframeSrc;
        }

        if (sources.length === 0) {
            $('video source').each((i, el) => {
                const src = $(el).attr('src');
                const label = $(el).attr('label') || $(el).attr('size') || 'Fonte ' + (i + 1);
                if (src) sources.push({ url: src, label, quality: label });
            });
        }

        res.json({ sources, iframe });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao buscar player do episódio" });
    }
};
