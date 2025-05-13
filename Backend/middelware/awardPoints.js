// middleware/awardPoints.js
const User = require('../models/User');

module.exports = async function awardPoints(req, res, next) {
  const userId = req.user.id; // from your auth middleware
  try {
    // +1 point per message
    await User.findByIdAndUpdate(userId, { $inc: { points: 1 } });
    // badge: first message
    const user = await User.findById(userId);
    if (user.points === 1) {
      user.badges.push({ name: 'First Message', awardedAt: new Date() });
      await user.save();
    }
  } catch (err) {
    console.error('Error awarding points:', err);
  }
  next();
};
