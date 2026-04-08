const { cors, scrapeAnimeFire } = require('./_utils');
module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    try {
        const page = req.query.page || 1;
        const animes = await scrapeAnimeFire(`https://animefire.io/lista-de-animes-dublados/${page}`);
        res.json(animes);
    } catch (e) {
        res.status(500).json({ erro: "Erro ao conectar com a fonte (AnimeFire)" });
    }
};
