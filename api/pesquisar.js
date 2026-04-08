const { cors, axios, cheerio, headers } = require('./_utils');

async function scrapeAnimeFirePage(url) {
    const { data } = await axios.get(url, { headers, timeout: 12000 });
    const $ = cheerio.load(data);
    const animes = [];
    $('article.cardUltimosEps').each((i, el) => {
        const link = $(el).find('a').attr('href');
        const titulo = $(el).find('.animeTitle').text().trim();
        const capa = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        if (link && titulo) {
            animes.push({ titulo, slug: link.split('/').pop(), capa: capa || '' });
        }
    });
    return animes;
}

function normalizeText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getLetterToken(value) {
    const normalized = normalizeText(value);
    const firstChar = normalized.charAt(0);
    if (!firstChar) return 'a';
    if (/[0-9]/.test(firstChar)) return '0-9';
    if (/[a-z]/.test(firstChar)) return firstChar;
    return 'a';
}

async function collectUnique(urls) {
    const settled = await Promise.allSettled(urls.map(scrapeAnimeFirePage));
    const unique = [];
    const seen = new Set();
    settled.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        result.value.forEach((anime) => {
            if (!anime.slug || seen.has(anime.slug)) return;
            seen.add(anime.slug);
            unique.push(anime);
        });
    });
    return unique;
}

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const q = String(req.query.q || '').trim();
    const scope = String(req.query.scope || 'all').trim().toLowerCase();
    const genero = String(req.query.genero || '').trim().toLowerCase();
    const fallbackPages = Math.min(Math.max(parseInt(req.query.pages || '12', 10) || 12, 1), 30);

    if (!q) return res.status(400).json({ erro: 'Parametro "q" obrigatorio' });

    const normalizedQuery = normalizeText(q);
    function filterMatches(items) {
        return items.filter((anime) => normalizeText(anime.titulo).includes(normalizedQuery));
    }

    function buildPrimaryUrls() {
        const letter = getLetterToken(q);
        if (scope === 'dublados') return [`https://animefire.io/lista-de-animes-dublados/${letter}`];
        if (scope === 'legendados') return [`https://animefire.io/lista-de-animes-legendados/${letter}`];
        if (scope === 'lancamentos') return Array.from({ length: Math.min(fallbackPages, 8) }, (_, i) => `https://animefire.io/em-lancamento/${i + 1}`);
        if (scope === 'genero' && genero) return Array.from({ length: fallbackPages }, (_, i) => `https://animefire.io/genero/${encodeURIComponent(genero)}/${i + 1}`);
        return [
            `https://animefire.io/lista-de-animes-dublados/${letter}`,
            `https://animefire.io/lista-de-animes-legendados/${letter}`,
            'https://animefire.io/em-lancamento/1',
            'https://animefire.io/em-lancamento/2'
        ];
    }

    function buildFallbackUrls() {
        if (scope === 'dublados') return Array.from({ length: fallbackPages }, (_, i) => `https://animefire.io/lista-de-animes-dublados/${i + 1}`);
        if (scope === 'legendados') return Array.from({ length: fallbackPages }, (_, i) => `https://animefire.io/lista-de-animes-legendados/${i + 1}`);
        if (scope === 'lancamentos') return Array.from({ length: Math.min(fallbackPages, 8) }, (_, i) => `https://animefire.io/em-lancamento/${i + 1}`);
        if (scope === 'genero' && genero) return Array.from({ length: fallbackPages }, (_, i) => `https://animefire.io/genero/${encodeURIComponent(genero)}/${i + 1}`);
        return [
            ...Array.from({ length: fallbackPages }, (_, i) => `https://animefire.io/lista-de-animes-dublados/${i + 1}`),
            ...Array.from({ length: fallbackPages }, (_, i) => `https://animefire.io/lista-de-animes-legendados/${i + 1}`),
            ...Array.from({ length: Math.min(fallbackPages, 8) }, (_, i) => `https://animefire.io/em-lancamento/${i + 1}`)
        ];
    }

    try {
        const primaryResults = filterMatches(await collectUnique(buildPrimaryUrls()));
        if (primaryResults.length > 0) return res.json(primaryResults);
        const fallbackResults = filterMatches(await collectUnique(buildFallbackUrls()));
        return res.json(fallbackResults);
    } catch (e) {
        return res.status(500).json({ erro: 'Erro na pesquisa do AnimeFire' });
    }
};
