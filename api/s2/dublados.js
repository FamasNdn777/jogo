const { cors, scrapeAnimesOnline, S2_BASE } = require('../_utils');
module.exports = async (req, res) => {
    cors(res);
    try {
        const page = req.query.page || 1;
        const pageUrl = page > 1 ? `${S2_BASE}/genero/dublado/page/${page}/` : `${S2_BASE}/genero/dublado/`;
        const animes = await scrapeAnimesOnline(pageUrl);
        res.json(animes);
    } catch (e) { res.status(500).json({ erro: "Erro ao conectar com a fonte (Animes Online)" }); }
};
