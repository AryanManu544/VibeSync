const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = process.env;

module.exports = (req, res, next) => {
  const token = req.headers['x-auth-token'];
  if (!token) 
    return res.status(401).json({ message: 'No token', status: 401 });

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', status: 401 });
  }
};