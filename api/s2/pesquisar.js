const { cors, scrapeAnimesOnline, S2_BASE } = require('../_utils');
module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const q = req.query.q;
    if (!q) return res.status(400).json({ erro: 'Parametro "q" obrigatorio' });
    try {
        const animes = await scrapeAnimesOnline(`${S2_BASE}/?s=${encodeURIComponent(q)}`);
        res.json(animes);
    } catch (e) {
        res.status(500).json({ erro: "Erro na pesquisa (Animes Online)" });
    }
};
