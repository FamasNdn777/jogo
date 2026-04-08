const { cors, axios, cheerio, headers, scrapeAnimeFire, categorias } = require('./_utils');

// --- Pesquisar helpers ---
async function scrapeAnimeFirePage(url) {
    const { data } = await axios.get(url, { headers, timeout: 12000 });
    const $ = cheerio.load(data);
    const animes = [];
    $('article.cardUltimosEps').each((i, el) => {
        const link = $(el).find('a').attr('href');
        const titulo = $(el).find('.animeTitle').text().trim();
        const capa = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        if (link && titulo) animes.push({ titulo, slug: link.split('/').pop(), capa: capa || '' });
    });
    return animes;
}
function normalizeText(v) { return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function getLetterToken(v) { const n=normalizeText(v), c=n.charAt(0); if(!c)return'a'; if(/[0-9]/.test(c))return'0-9'; if(/[a-z]/.test(c))return c; return'a'; }
async function collectUnique(urls) {
    const settled = await Promise.allSettled(urls.map(scrapeAnimeFirePage));
    const unique = [], seen = new Set();
    settled.forEach(r => { if(r.status!=='fulfilled')return; r.value.forEach(a => { if(!a.slug||seen.has(a.slug))return; seen.add(a.slug); unique.push(a); }); });
    return unique;
}

// --- Route handlers ---
const routes = {
    async dublados(req, res) {
        const page = req.query.page || 1;
        const animes = await scrapeAnimeFire(`https://animefire.io/lista-de-animes-dublados/${page}`);
        res.json(animes);
    },
    async legendados(req, res) {
        const page = req.query.page || 1;
        const animes = await scrapeAnimeFire(`https://animefire.io/lista-de-animes-legendados/${page}`);
        res.json(animes);
    },
    async lancamentos(req, res) {
        const page = req.query.page || 1;
        const animes = await scrapeAnimeFire(`https://animefire.io/em-lancamento/${page}`);
        res.json(animes);
    },
    categorias(req, res) { res.json(categorias); },
    async detalhes(req, res) {
        const slug = req.query.anime;
        if (!slug) return res.status(400).json({ erro: 'Parâmetro "anime" é obrigatório' });
        const url = `https://animefire.io/animes/${slug}`;
        const { data } = await axios.get(url, { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        const titulo = $('h1.quicksand400, .animeHeaderTitulo h1, h1').first().text().trim() || slug;
        const capa = $('meta[property="og:image"]').attr('content') || $('.sub_animepage_img img').attr('data-src') || $('.sub_animepage_img img').attr('src') || '';
        const sinopse = $('.divSinopse, .sinopse_container_content, .animeDescription').first().text().trim() || '';
        let ano = '', estudio = '';
        $('.animeInfo span, .spanAnimeInfo').each((i, el) => { const txt = $(el).text().trim(); if (/^\d{4}$/.test(txt)) ano = txt; });
        $('.animeInfo a, .spanAnimeInfo a').each((i, el) => { const href = $(el).attr('href')||''; if (href.includes('estudio')||href.includes('studio')) estudio = $(el).text().trim(); });
        const generos = [];
        $('a[href*="/genero/"], .animeGen a').each((i, el) => { const g=$(el).text().trim(); if(g&&!generos.includes(g)) generos.push(g); });
        const episodios = [];
        $('a.lEp, .div_video_list a, a[href*="animefire.io/video"]').each((i, el) => {
            const link=$(el).attr('href')||'', nome=$(el).text().trim()||`Episódio ${i+1}`;
            const epCapa=$(el).find('img').attr('data-src')||$(el).find('img').attr('src')||'';
            if(link) episodios.push({nome,link,capa:epCapa});
        });
        res.json({titulo,capa,sinopse,ano,estudio,generos,episodios});
    },
    async player(req, res) {
        const link = req.query.link;
        if (!link) return res.status(400).json({ erro: 'Parâmetro "link" é obrigatório' });
        const { data } = await axios.get(link, { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        const videoEl = $('video#my-video, video.video-js, video[data-video-src]').first();
        const videoSrcUrl = videoEl.attr('data-video-src') || '';
        let sources = [], iframe = '';
        if (videoSrcUrl) {
            try {
                const fullUrl = videoSrcUrl.startsWith('http') ? videoSrcUrl : 'https://animefire.io' + videoSrcUrl;
                const videoRes = await axios.get(fullUrl, { headers: { ...headers, 'Referer': link, 'Accept': 'application/json, text/plain, */*' }, timeout: 10000 });
                const vData = videoRes.data;
                if (vData && Array.isArray(vData.data)) sources = vData.data.map(s => ({ url: s.src||s.url||'', label: s.label||s.quality||'', quality: s.label||s.quality||'' })).filter(s => s.url);
                else if (vData && typeof vData==='object' && vData.src) sources = [{ url: vData.src, label: 'Default', quality: 'Default' }];
                else if (typeof vData==='string') { const m = vData.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || vData.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || []; sources = m.map((u,i) => ({url:u,label:'Fonte '+(i+1),quality:'Fonte '+(i+1)})); }
            } catch(e2){}
        }
        if (!sources.length) { const is=$('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"]').first().attr('src')||''; if(is) iframe=is.startsWith('http')?is:'https:'+is; }
        if (!sources.length) { $('video source').each((i,el)=>{const src=$(el).attr('src'),label=$(el).attr('label')||$(el).attr('size')||'Fonte '+(i+1); if(src) sources.push({url:src,label,quality:label});}); }
        res.json({sources,iframe});
    },
    async pesquisar(req, res) {
        const q = String(req.query.q||'').trim();
        const scope = String(req.query.scope||'all').trim().toLowerCase();
        const genero = String(req.query.genero||'').trim().toLowerCase();
        const fallbackPages = Math.min(Math.max(parseInt(req.query.pages||'12',10)||12,1),30);
        if(!q) return res.status(400).json({erro:'Parametro "q" obrigatorio'});
        const nq = normalizeText(q);
        const filter = items => items.filter(a => normalizeText(a.titulo).includes(nq));
        const letter = getLetterToken(q);
        function primaryUrls() {
            if(scope==='dublados') return [`https://animefire.io/lista-de-animes-dublados/${letter}`];
            if(scope==='legendados') return [`https://animefire.io/lista-de-animes-legendados/${letter}`];
            if(scope==='lancamentos') return Array.from({length:Math.min(fallbackPages,8)},(_,i)=>`https://animefire.io/em-lancamento/${i+1}`);
            if(scope==='genero'&&genero) return Array.from({length:fallbackPages},(_,i)=>`https://animefire.io/genero/${encodeURIComponent(genero)}/${i+1}`);
            return [`https://animefire.io/lista-de-animes-dublados/${letter}`,`https://animefire.io/lista-de-animes-legendados/${letter}`,'https://animefire.io/em-lancamento/1','https://animefire.io/em-lancamento/2'];
        }
        function fallbackUrls() {
            if(scope==='dublados') return Array.from({length:fallbackPages},(_,i)=>`https://animefire.io/lista-de-animes-dublados/${i+1}`);
            if(scope==='legendados') return Array.from({length:fallbackPages},(_,i)=>`https://animefire.io/lista-de-animes-legendados/${i+1}`);
            if(scope==='lancamentos') return Array.from({length:Math.min(fallbackPages,8)},(_,i)=>`https://animefire.io/em-lancamento/${i+1}`);
            if(scope==='genero'&&genero) return Array.from({length:fallbackPages},(_,i)=>`https://animefire.io/genero/${encodeURIComponent(genero)}/${i+1}`);
            return [...Array.from({length:fallbackPages},(_,i)=>`https://animefire.io/lista-de-animes-dublados/${i+1}`),...Array.from({length:fallbackPages},(_,i)=>`https://animefire.io/lista-de-animes-legendados/${i+1}`),...Array.from({length:Math.min(fallbackPages,8)},(_,i)=>`https://animefire.io/em-lancamento/${i+1}`)];
        }
        const primary = filter(await collectUnique(primaryUrls()));
        if(primary.length>0) return res.json(primary);
        return res.json(filter(await collectUnique(fallbackUrls())));
    },
    async genero(req, res) {
        const genero = req.query.genero;
        const page = req.query.page || 1;
        if(!genero) return res.status(400).json({erro:'Parâmetro "genero" é obrigatório'});
        const animes = await scrapeAnimeFire(`https://animefire.io/genero/${genero}/${page}`);
        res.json(animes);
    }
};

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Extract route from path: /api/dublados -> "dublados", /api/genero/acao -> "genero"
    const pathParts = (req.url || '').replace(/\?.*$/, '').replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const route = pathParts[0] || '';
    
    // For /api/genero/:genero, put the genre in query
    if (route === 'genero' && pathParts[1]) {
        req.query.genero = pathParts[1];
    }

    const handler = routes[route];
    if (!handler) return res.status(404).json({ erro: 'Rota não encontrada: /api/' + route });

    try {
        await handler(req, res);
    } catch (e) {
        res.status(500).json({ erro: 'Erro ao processar requisição' });
    }
};
