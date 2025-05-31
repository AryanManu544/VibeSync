const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_LIFETIME = '2h',
  REFRESH_TOKEN_LIFETIME = '7d',
  NODE_ENV
} = process.env;

const signAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, tag: user.tag }, 
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id }, 
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_LIFETIME }
  );
};

exports.register = async (req, res) => {
  const { email, username, password } = req.body;
  const file = req.file;

  if (!email || !username || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (password.length < 7) {
    return res.status(400).json({ success: false, message: 'Password must be at least 7 characters' });
  }

  try {
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const tag = await require('../utils/helpers').isUsernameAvailable(username);
    const hashedPwd = await bcrypt.hash(password, 12);

    const profile_pic = file ? file.path : process.env.DEFAULT_PROFILE_PIC;

    const newUser = new User({ username, tag, email, password: hashedPwd, profile_pic });
    await newUser.save();

    const accessToken = signAccessToken(newUser);
    const refreshToken = signRefreshToken(newUser);

    // Send refresh token in httpOnly cookie
    res
      .cookie('jid', refreshToken, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh_token'
      })
      .status(201)
      .json({ success: true, accessToken });

  } catch (err) {
    console.error('❌ Register error:', err);
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res
      .cookie('jid', refreshToken, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh_token'
      })
      .status(200)
      .json({ success: true, accessToken });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('jid', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh_token'
  });
  return res.status(200).json({ success: true });
};

exports.refreshToken = (req, res) => {
  const token = req.cookies.jid;
  if (!token) {
    return res.status(401).json({ success: false, accessToken: '' });
  }

  let payload;
  try {
    payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (err) {
    console.error('❌ Refresh token error:', err);
    return res.status(401).json({ success: false, accessToken: '' });
  }

  // Optionally verify user still exists or tokenVersion
  const accessToken = jwt.sign(
    { id: payload.id },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_LIFETIME }
  );

  return res.json({ success: true, accessToken });
};