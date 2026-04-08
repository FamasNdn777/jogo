const { cors, CATEGORIAS_S1 } = require('./_utils');
module.exports = (req, res) => { cors(res); res.json(CATEGORIAS_S1); };
