const { cors, CATEGORIAS_S2 } = require('../_utils');
module.exports = (req, res) => { cors(res); res.json(CATEGORIAS_S2); };
