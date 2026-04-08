const { cors, headers, axios, cheerio } = require('./_utils');
module.exports = async (req, res) => {
    cors(res);
    const slug = req.query.anime;
    if (!slug) return res.status(400).json({ erro: 'Parâmetro "anime" é obrigatório' });
    try {
        const url = `https://animefire.io/animes/${slug}`;
        const { data } = await axios.get(url, { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        const titulo = $('h1.quicksand400, .animeHeaderTitulo h1, h1').first().text().trim() || slug;
        const capa = $('meta[property="og:image"]').attr('content') || $('.sub_animepage_img img').attr('data-src') || $('.sub_animepage_img img').attr('src') || '';
        const sinopse = $('.divSinopse, .sinopse_container_content, .animeDescription').first().text().trim() || '';
        let ano = '', estudio = '';
        $('.animeInfo span, .spanAnimeInfo').each((i, el) => { const txt = $(el).text().trim(); if (/^\d{4}$/.test(txt)) ano = txt; });
        $('.animeInfo a, .spanAnimeInfo a').each((i, el) => { const href = $(el).attr('href') || ''; if (href.includes('estudio') || href.includes('studio')) estudio = $(el).text().trim(); });
        const generos = [];
        $('a[href*="/genero/"], .animeGen a').each((i, el) => { const g = $(el).text().trim(); if (g && !generos.includes(g)) generos.push(g); });
        const episodios = [];
        $('a.lEp, .div_video_list a, a[href*="animefire.io/video"]').each((i, el) => {
            const link = $(el).attr('href') || '';
            const nome = $(el).text().trim() || `Episódio ${i + 1}`;
            const epCapa = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
            if (link) episodios.push({ nome, link, capa: epCapa });
        });
        res.json({ titulo, capa, sinopse, ano, estudio, generos, episodios });
    } catch (e) { res.status(500).json({ erro: "Erro ao buscar detalhes do anime (AnimeFire)" }); }
};
