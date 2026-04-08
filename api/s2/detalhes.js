const { cors, axios, cheerio, headers, S2_BASE } = require('../_utils');
module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const slug = req.query.anime;
    if (!slug) return res.status(400).json({ erro: 'Parâmetro "anime" é obrigatório' });

    try {
        const url = `${S2_BASE}/anime/${slug}/`;
        const { data } = await axios.get(url, { headers, timeout: 15000 });
        const $ = cheerio.load(data);

        const titulo = $('.sheader .data h1').first().text().trim()
            .replace(/ Todos os Episodios Online$/i, '').replace(/ Online$/i, '') || slug;
        const capa = $('meta[property="og:image"]').attr('content') || $('.sheader .poster img').attr('src') || '';
        const sinopse = $('.resumotemp .wp-content p').first().text().trim() || '';

        let ano = '';
        const dateSpan = $('.sheader .extra .date').text().trim();
        if (/^\d{4}$/.test(dateSpan)) ano = dateSpan;

        const generos = [];
        $('.sgeneros a').each((i, el) => {
            const g = $(el).text().trim();
            if (g && g !== 'Legendado' && g !== 'Dublado' && !g.startsWith('Letra ') && !generos.includes(g)) generos.push(g);
        });

        const episodios = [];
        $('.episodios li').each((i, el) => {
            const linkEl = $(el).find('.episodiotitle a').first();
            const link = linkEl.attr('href') || '';
            const nome = linkEl.text().trim() || `Episódio ${i + 1}`;
            const epCapa = $(el).find('.imagen img').attr('src') || '';
            if (link) episodios.push({ nome, link, capa: epCapa });
        });

        res.json({ titulo, capa, sinopse, ano, estudio: '', generos, episodios });
    } catch (e) {
        res.status(500).json({ erro: "Erro ao buscar detalhes do anime (Animes Online)" });
    }
};
