const { cors, scrapeAnimesOnline, S2_BASE } = require('../_utils');
module.exports = async (req, res) => {
    cors(res);
    const q = req.query.q;
    if (!q) return res.status(400).json({ erro: 'Parametro "q" obrigatorio' });
    try {
        const animes = await scrapeAnimesOnline(`${S2_BASE}/?s=${encodeURIComponent(q)}`);
        res.json(animes);
    } catch (e) { res.status(500).json({ erro: "Erro ao conectar com a fonte (Animes Online)" }); }
};
