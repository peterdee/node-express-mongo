const db = require('../../db');

module.exports = async (req, res) => {
  try {
    const A = new db.User({ email: 'saved@saved' });
    const B = new db.Password({ userId: A.id, hash: 'asd123' });
    await A.save();
    await B.save();
    return res.status(200).send({ info: 'OK' });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ info: 'ERROR' });
  }
};
