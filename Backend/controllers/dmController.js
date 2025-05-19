const User = require('../models/User');
const DMChat = require('../models/DMChat');

exports.createDM = async (req, res) => {
  try {
    const senderId = req.userId;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'Invalid participants', status: 400 });
    }

    const participants = [senderId, ...participantIds].sort();

    const existing = await DMChat.findOne({ participants });
    if (existing) {
      return res.json({ status: 200, message: 'Already exists', dmId: existing._id });
    }

    const newDM = await DMChat.create({ participants, messages: [] });

    const users = await User.find({ _id: { $in: participants } });

    for (const uid of participants) {
      const others = users.filter(u => u._id.toString() !== uid);
      const dmEntries = others.map(u => ({
        userId: u._id,
        name: u.name || u.username,
        tag: u.tag,
        profile_pic: u.profile_pic || ''
      }));

      await User.findByIdAndUpdate(uid, {
        $addToSet: { dms: { $each: dmEntries } }
      });
    }

    return res.json({ status: 201, message: 'DM created', dmId: newDM._id });

  } catch (err) {
    console.error('❌ createDM error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }
};

exports.getDMs = async (req, res) => {
  try {
    const userId = req.userId;
    const dms = await DMChat.find({ participants: userId });
    const users = await User.find({});
    const dmList = [];

    for (const dm of dms) {
      const otherId = dm.participants.find(id => id !== userId);
      const other = users.find(u => u._id.toString() === otherId);

      if (other) {
        dmList.push({
          id: other._id.toString(),
          name: other.name || other.username,
          tag: other.tag,
          profile_pic: other.profile_pic || null
        });
      }
    }

    return res.json({ status: 200, dms: dmList });

  } catch (err) {
    console.error('❌ getDMs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.storeDMMessage = async (req, res) => {
  const senderId = req.userId;
  const { to, content, timestamp, senderName, senderPic } = req.body;

  if (!to || !content || !timestamp) {
    return res.status(400).json({ message: 'Missing fields', status: 400 });
  }

  const participants = [senderId, to].sort();

  const msg = {
    senderId,
    senderName,
    senderPic,
    content,
    timestamp
  };

  try {
    const updated = await DMChat.findOneAndUpdate(
      { participants },
      { $push: { messages: msg }, $setOnInsert: { participants } },
      { upsert: true, new: true }
    );

    return res.json({ message: 'DM stored', status: 200 });

  } catch (err) {
    console.error('❌ storeDMMessage error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }
};

exports.getDMHistory = async (req, res) => {
  const user1 = req.userId;
  const { user2 } = req.body;

  if (!user2) {
    return res.status(400).json({ error: 'Missing user2', history: [] });
  }

  const participants = [user1, user2].sort();

  try {
    const chatDoc = await DMChat.findOneAndUpdate(
      { participants },
      { $setOnInsert: { participants, messages: [] } },
      { upsert: true, new: true }
    );

    return res.json({ history: chatDoc.messages });

  } catch (err) {
    console.error('❌ getDMHistory error:', err);
    return res.status(500).json({ error: 'Server error', history: [] });
  }
};

exports.editDMMessage = async (req, res) => {
  const { peerId, timestamp, newContent } = req.body;
  const participants = [req.userId, peerId].sort();

  try {
    const result = await DMChat.updateOne(
      { participants, 'messages.senderId': req.userId, 'messages.timestamp': timestamp },
      { $set: { 'messages.$.content': newContent, 'messages.$.edited': true } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Not found or not yours', status: 404 });
    }

    return res.json({ message: 'Edited', status: 200 });

  } catch (err) {
    console.error('❌ editDMMessage error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }
};

exports.deleteDMMessage = async (req, res) => {
  const { peerId, timestamp } = req.body;
  const participants = [req.userId, peerId].sort();

  try {
    const result = await DMChat.updateOne(
      { participants },
      { $pull: { messages: { senderId: req.userId, timestamp } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Not found or not yours', status: 404 });
    }

    return res.json({ message: 'Deleted', status: 200 });

  } catch (err) {
    console.error('❌ deleteDMMessage error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }
};
