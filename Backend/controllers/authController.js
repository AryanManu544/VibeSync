const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isUsernameAvailable } = require('../utils/helpers');

const DEFAULT_PIC = process.env.DEFAULT_PROFILE_PIC;
const JWT_SECRET = process.env.ACCESS_TOKEN;

exports.register = async (req, res) => {
  const { email, username, password } = req.body;
  const file = req.file;   

  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  if (password.length < 7) {
    return res
      .status(400)
      .json({ success: false, message: 'Password must be at least 7 characters' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already in use' });
    }

    const tag       = await isUsernameAvailable(username);
    const hashedPwd = await bcrypt.hash(password, 12);

    const profile_pic = file
      ? file.path
      : DEFAULT_PIC;

    const newUser = new User({
      username,
      tag,
      email,
      password: hashedPwd,
      profile_pic
    });
    await newUser.save();

    const authtoken = jwt.sign(
      { sub: newUser._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res
      .status(201)
      .json({ success: true, token: authtoken });

  } catch (err) {
    console.error('❌ Register error:', err);
    if (err.code === 11000 && err.keyPattern?.email) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already in use' });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const userData = await User.findOne({ email });
    if (!userData)
      return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign(
      {
        id: userData._id,
        username: userData.username,
        tag: userData.tag,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token });

  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: 'Server error' });
  }
};
