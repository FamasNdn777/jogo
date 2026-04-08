const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function scrapeAnimeFire(url) {
    const { data } = await axios.get(url, { headers, timeout: 10000 });
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

const S2_BASE = 'https://animesonlinecc.to';

async function scrapeAnimesOnline(url) {
    const { data } = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(data);
    const animes = [];
    $('article.item.tvshows, article.item').each((i, el) => {
        const linkEl = $(el).find('.poster a').first();
        const href = linkEl.attr('href') || '';
        const slug = href.replace(/\/$/, '').split('/').pop();
        const titulo = $(el).find('.data h3 a').text().trim() || $(el).find('.data h3').text().trim();
        const capa = $(el).find('.poster img').attr('src') || '';
        if (slug && titulo) animes.push({ titulo, slug, capa });
    });
    return animes;
}

const CATEGORIAS_S1 = [
    { slug: 'acao', nome: 'Ação' },{ slug: 'aventura', nome: 'Aventura' },
    { slug: 'comedia', nome: 'Comédia' },{ slug: 'drama', nome: 'Drama' },
    { slug: 'ecchi', nome: 'Ecchi' },{ slug: 'fantasia', nome: 'Fantasia' },
    { slug: 'harem', nome: 'Harem' },{ slug: 'horror', nome: 'Horror' },
    { slug: 'isekai', nome: 'Isekai' },{ slug: 'josei', nome: 'Josei' },
    { slug: 'magia', nome: 'Magia' },{ slug: 'mecha', nome: 'Mecha' },
    { slug: 'militar', nome: 'Militar' },{ slug: 'misterio', nome: 'Mistério' },
    { slug: 'musical', nome: 'Musical' },{ slug: 'policial', nome: 'Policial' },
    { slug: 'psicologico', nome: 'Psicológico' },{ slug: 'romance', nome: 'Romance' },
    { slug: 'samurai', nome: 'Samurai' },{ slug: 'sci-fi', nome: 'Sci-Fi' },
    { slug: 'seinen', nome: 'Seinen' },{ slug: 'shoujo', nome: 'Shoujo' },
    { slug: 'shounen', nome: 'Shounen' },{ slug: 'slice-of-life', nome: 'Slice of Life' },
    { slug: 'sobrenatural', nome: 'Sobrenatural' },{ slug: 'sports', nome: 'Esportes' },
    { slug: 'super-poder', nome: 'Super Poder' },{ slug: 'suspense', nome: 'Suspense' },
    { slug: 'terror', nome: 'Terror' },{ slug: 'vida-escolar', nome: 'Vida Escolar' }
];

const CATEGORIAS_S2 = [...CATEGORIAS_S1]; // Same categories

module.exports = { headers, cors, scrapeAnimeFire, scrapeAnimesOnline, S2_BASE, CATEGORIAS_S1, CATEGORIAS_S2, axios, cheerio };
