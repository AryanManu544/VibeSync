const jwt = require('jsonwebtoken');

const authToken = (req, res, next) => {
  const token = req.headers['x-auth-token'];
  if (!token) return res.status(401).json({ message: 'No token', status: 401 });

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN);
    req.userId = payload.id;
    next();
  } catch (err) {
    console.error('✨ authToken error:', err);
    return res.status(401).json({ message: 'Invalid token', status: 401 });
  }
};

module.exports = authToken;
