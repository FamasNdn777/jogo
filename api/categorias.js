const { cors, categorias } = require('./_utils');
module.exports = (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    res.json(categorias);
};
