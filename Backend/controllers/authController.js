const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isUsernameAvailable } = require('../utils/helpers');

const DEFAULT_PIC = process.env.DEFAULT_PROFILE_PIC;
const JWT_SECRET = process.env.ACCESS_TOKEN;

exports.register = async (req, res) => {
  const { email, username, password } = req.body;
  const profile_pic_file = req.file;

  if (!email || !username || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (password.length < 7) {
    return res.status(400).json({ success: false, message: 'Password must be at least 7 characters' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const tag = await isUsernameAvailable(username);
    const hashedPwd = await bcrypt.hash(password, 12);

    // Store as base64 string if needed (optional: store as binary or cloud)
    const profile_pic = profile_pic_file
      ? `data:${profile_pic_file.mimetype};base64,${profile_pic_file.buffer.toString('base64')}`
      : DEFAULT_PIC;

    const newUser = new User({
      username,
      tag,
      email,
      password: hashedPwd,
      profile_pic,
    });

    await newUser.save();

    const authtoken = jwt.sign(
      { id: newUser._id, username, tag, profile_pic },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({ success: true, authtoken });

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
        profile_pic: userData.profile_pic
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
