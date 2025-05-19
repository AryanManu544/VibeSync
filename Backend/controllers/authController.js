const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isUsernameAvailable } = require('../utils/helpers');

const DEFAULT_PIC = process.env.DEFAULT_PROFILE_PIC;

exports.register = async (req, res) => {
  const { email, username, password, profile_pic } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing fields', status: 400 });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.authorized) {
      return res.status(202).json({ message: 'User already exists', status: 202 });
    }

    if (password.length < 7) {
      return res.status(400).json({ message: 'Password too short', status: 400 });
    }

    const tag = await isUsernameAvailable(username);
    const hashedPwd = await bcrypt.hash(password, 12);

    const newUser = new User({
      username,
      tag,
      email,
      password: hashedPwd,
      profile_pic: profile_pic?.startsWith("data:image/") ? profile_pic : DEFAULT_PIC
    });

    const savedUser = await newUser.save();
    return res.status(201).json({ message: 'User created!', status: 201, user: savedUser });

  } catch (err) {
    console.error('❌ Register error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
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
