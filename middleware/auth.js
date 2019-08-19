const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  // get token from header
  const token = req.header('x-auth-token');

  // check if no token
  if (!token) {
    return res.status(401).json({
      msg: 'Authorization denied!'
    });
  }

  // verify token
  try {
    const decoded = jwt.verify(token, config.JWT_KEY);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({
      msg: 'Authorization denied!'
    })
  }
};