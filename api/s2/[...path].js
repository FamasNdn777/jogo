const { cors, axios, cheerio, headers, scrapeAnimesOnline, S2_BASE, categorias } = require('../_utils');

const routes = {
    async dublados(req, res) {
        const page = req.query.page || 1;
        const pageUrl = page > 1 ? `${S2_BASE}/genero/dublado/page/${page}/` : `${S2_BASE}/genero/dublado/`;
        res.json(await scrapeAnimesOnline(pageUrl));
    },
    async legendados(req, res) {
        const page = req.query.page || 1;
        const pageUrl = page > 1 ? `${S2_BASE}/genero/legendado/page/${page}/` : `${S2_BASE}/genero/legendado/`;
        res.json(await scrapeAnimesOnline(pageUrl));
    },
    async lancamentos(req, res) {
        const page = req.query.page || 1;
        const pageUrl = page > 1 ? `${S2_BASE}/genero/legendado/page/${page}/` : `${S2_BASE}/genero/legendado/`;
        res.json(await scrapeAnimesOnline(pageUrl));
    },
    categorias(req, res) { res.json(categorias); },
    async detalhes(req, res) {
        const slug = req.query.anime;
        if (!slug) return res.status(400).json({ erro: 'Parâmetro "anime" é obrigatório' });
        const url = `${S2_BASE}/anime/${slug}/`;
        const { data } = await axios.get(url, { headers, timeout: 15000 });
        const $ = cheerio.load(data);
        const titulo = $('.sheader .data h1').first().text().trim().replace(/ Todos os Episodios Online$/i,'').replace(/ Online$/i,'') || slug;
        const capa = $('meta[property="og:image"]').attr('content') || $('.sheader .poster img').attr('src') || '';
        const sinopse = $('.resumotemp .wp-content p').first().text().trim() || '';
        let ano = ''; const dateSpan = $('.sheader .extra .date').text().trim(); if(/^\d{4}$/.test(dateSpan)) ano=dateSpan;
        const generos = [];
        $('.sgeneros a').each((i,el) => { const g=$(el).text().trim(); if(g&&g!=='Legendado'&&g!=='Dublado'&&!g.startsWith('Letra ')&&!generos.includes(g)) generos.push(g); });
        const episodios = [];
        $('.episodios li').each((i,el) => { const le=$(el).find('.episodiotitle a').first(), link=le.attr('href')||'', nome=le.text().trim()||`Episódio ${i+1}`, epCapa=$(el).find('.imagen img').attr('src')||''; if(link) episodios.push({nome,link,capa:epCapa}); });
        res.json({titulo,capa,sinopse,ano,estudio:'',generos,episodios});
    },
    async player(req, res) {
        const link = req.query.link;
        if (!link) return res.status(400).json({ erro: 'Parâmetro "link" é obrigatório' });
        const { data } = await axios.get(link, { headers, timeout: 15000 });
        const $ = cheerio.load(data);
        let sources = [], iframe = '';
        const iframeSrc = $('iframe[src*="player"], iframe[src*="embed"], iframe[src*="video"], .playex iframe, #playex iframe, .dooplay_player iframe').first().attr('src') || '';
        if(iframeSrc) iframe = iframeSrc.startsWith('http') ? iframeSrc : 'https:'+iframeSrc;
        $('video source, source[src*=".mp4"], source[src*=".m3u8"]').each((i,el) => { const src=$(el).attr('src'), label=$(el).attr('label')||$(el).attr('size')||'Fonte '+(i+1); if(src) sources.push({url:src,label,quality:label}); });
        res.json({sources,iframe});
    },
    async pesquisar(req, res) {
        const q = req.query.q;
        if (!q) return res.status(400).json({ erro: 'Parametro "q" obrigatorio' });
        res.json(await scrapeAnimesOnline(`${S2_BASE}/?s=${encodeURIComponent(q)}`));
    },
    async genero(req, res) {
        const genero = req.query.genero;
        const page = req.query.page || 1;
        if(!genero) return res.status(400).json({erro:'Parâmetro "genero" é obrigatório'});
        const pageUrl = page > 1 ? `${S2_BASE}/genero/${genero}/page/${page}/` : `${S2_BASE}/genero/${genero}/`;
        res.json(await scrapeAnimesOnline(pageUrl));
    }
};

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const pathParts = (req.url || '').replace(/\?.*$/, '').replace(/^\/api\/s2\/?/, '').split('/').filter(Boolean);
    const route = pathParts[0] || '';
    
    if (route === 'genero' && pathParts[1]) {
        req.query.genero = pathParts[1];
    }

    const handler = routes[route];
    if (!handler) return res.status(404).json({ erro: 'Rota não encontrada: /api/s2/' + route });

    try {
        await handler(req, res);
    } catch (e) {
        res.status(500).json({ erro: 'Erro ao processar requisição' });
    }
};
