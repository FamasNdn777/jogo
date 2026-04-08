const { cors, scrapeAnimeFire } = require('../_utils');
module.exports = async (req, res) => {
    cors(res);
    try {
        const { genero } = req.query;
        const page = req.query.page || 1;
        const animes = await scrapeAnimeFire(`https://animefire.io/genero/${genero}/${page}`);
        res.json(animes);
    } catch (e) { res.status(500).json({ erro: "Erro ao conectar com a fonte (AnimeFire)" }); }
};
