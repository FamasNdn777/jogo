/* ============================================================
   ADICIONE ESTE ENDPOINT NO SEU server.js
   (Cole antes do "app.listen")
   ============================================================ */

// ===== ENDPOINT PLAYER S1 — AnimeFire =====
app.get('/api/player', async (req, res) => {
    const link = req.query.link;
    if (!link) {
        log.warn('S1', 'Requisição de player sem parâmetro "link"');
        return res.status(400).json({ erro: 'Parâmetro "link" é obrigatório' });
    }

    try {
        log.info('S1', `Buscando player: ${link}`);
        const { data } = await axios.get(link, { headers, timeout: 10000 });
        const $ = cheerio.load(data);

        // Extrair o data-video-src do elemento <video>
        const videoEl = $('video#my-video, video.video-js, video[data-video-src]').first();
        const videoSrcUrl = videoEl.attr('data-video-src') || '';

        let sources = [];
        let iframe = '';

        if (videoSrcUrl) {
            // Buscar as fontes de vídeo reais
            try {
                const fullUrl = videoSrcUrl.startsWith('http') ? videoSrcUrl : 'https://animefire.io' + videoSrcUrl;
                log.info('S1', `Buscando fontes de vídeo: ${fullUrl}`);
                const videoRes = await axios.get(fullUrl, {
                    headers: {
                        ...headers,
                        'Referer': link,
                        'Accept': 'application/json, text/plain, */*'
                    },
                    timeout: 10000
                });

                const vData = videoRes.data;

                // AnimeFire retorna JSON com array de fontes
                if (vData && Array.isArray(vData.data)) {
                    sources = vData.data.map(s => ({
                        url: s.src || s.url || '',
                        label: s.label || s.quality || '',
                        quality: s.label || s.quality || ''
                    })).filter(s => s.url);
                } else if (vData && typeof vData === 'object' && vData.src) {
                    sources = [{ url: vData.src, label: 'Default', quality: 'Default' }];
                } else if (typeof vData === 'string') {
                    // Tentar extrair URLs de vídeo do texto
                    const urlMatches = vData.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) ||
                                       vData.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
                    sources = urlMatches.map((u, i) => ({
                        url: u,
                        label: 'Fonte ' + (i + 1),
                        quality: 'Fonte ' + (i + 1)
                    }));
                }
            } catch (e2) {
                log.warn('S1', `Falha ao buscar fontes de vídeo: ${e2.message}`);
            }
        }

        // Fallback: buscar iframe se não encontrou vídeo direto
        if (sources.length === 0) {
            const iframeSrc = $('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"]').first().attr('src') || '';
            if (iframeSrc) {
                iframe = iframeSrc.startsWith('http') ? iframeSrc : 'https:' + iframeSrc;
            }
        }

        // Fallback: buscar <source> tags
        if (sources.length === 0) {
            $('video source').each((i, el) => {
                const src = $(el).attr('src');
                const label = $(el).attr('label') || $(el).attr('size') || 'Fonte ' + (i + 1);
                if (src) sources.push({ url: src, label, quality: label });
            });
        }

        log.success('S1', `Player: ${sources.length} fontes, iframe: ${iframe ? 'sim' : 'não'}`);
        res.json({ sources, iframe });
    } catch (e) {
        log.error('S1', `Player falhou para "${link}": ${e.message}`);
        if (e.response && e.response.status === 403) log.warn('S1', 'HTTP 403 — IP possivelmente bloqueado');
        res.status(500).json({ erro: "Erro ao buscar player do episódio" });
    }
});

// ===== ENDPOINT PLAYER S2 — Animes Online =====
app.get('/api/s2/player', async (req, res) => {
    const link = req.query.link;
    if (!link) {
        log.warn('S2', 'Requisição de player sem parâmetro "link"');
        return res.status(400).json({ erro: 'Parâmetro "link" é obrigatório' });
    }

    try {
        log.info('S2', `Buscando player: ${link}`);
        const { data } = await axios.get(link, { headers, timeout: 15000 });
        const $ = cheerio.load(data);

        let sources = [];
        let iframe = '';

        // Animes Online usa iframes para players
        const iframeSrc = $('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"], .playex iframe, #playex iframe, .dooplay_player iframe').first().attr('src') || '';
        if (iframeSrc) {
            iframe = iframeSrc.startsWith('http') ? iframeSrc : 'https:' + iframeSrc;
        }

        // Tentar extrair vídeos diretos
        $('video source, source[src*=".mp4"], source[src*=".m3u8"]').each((i, el) => {
            const src = $(el).attr('src');
            const label = $(el).attr('label') || $(el).attr('size') || 'Fonte ' + (i + 1);
            if (src) sources.push({ url: src, label, quality: label });
        });

        log.success('S2', `Player: ${sources.length} fontes, iframe: ${iframe ? 'sim' : 'não'}`);
        res.json({ sources, iframe });
    } catch (e) {
        log.error('S2', `Player falhou para "${link}": ${e.message}`);
        res.status(500).json({ erro: "Erro ao buscar player do episódio" });
    }
});
