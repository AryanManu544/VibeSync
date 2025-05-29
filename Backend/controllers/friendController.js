const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const upload = multer();

function checkExists(arr, id) {
  return arr.some(e => e.id === id);
}

exports.addFriend = async (req, res) => {
  const { friend } = req.body;
  const userId = req.userId;

  const hashIndex = friend.indexOf('#');
  if (hashIndex === -1) {
    return res.status(400).json({ message: 'Invalid input', status: 400 });
  }

  const username = friend.slice(0, hashIndex);
  const tag = friend.slice(hashIndex + 1);

  try {
    const user = await User.findById(userId);
    const target = await User.findOne({ username, tag });

    if (!target) {
      return res.status(404).json({ message: 'User not found', status: 404 });
    }

    const isFriend = checkExists(target.friends, userId);
    if (isFriend) {
      return res.status(201).json({ message: 'Already friends', status: 201 });
    }

    const alreadySent = checkExists(target.incoming_reqs, userId);
    const alreadyReceived = checkExists(user.outgoing_reqs, target._id.toString());

    if (alreadySent || alreadyReceived) {
      return res.status(202).json({ message: 'Request already sent', status: 202 });
    }

    // update both users with requests
    await User.findByIdAndUpdate(target._id, {
      $push: {
        incoming_reqs: {
          id: userId,
          username: user.username,
          profile_pic: user.profile_pic,
          tag: user.tag,
          status: 'incoming'
        }
      }
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        outgoing_reqs: {
          id: target._id.toString(),
          username: target.username,
          profile_pic: target.profile_pic,
          tag: target.tag,
          status: 'outgoing'
        }
      }
    });

    return res.status(203).json({ message: 'Request sent', status: 203 });

  } catch (err) {
    console.error('❌ addFriend error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.processRequest = [
  upload.none(), 
  async (req, res) => {
    try {
      const { message } = req.body;
      const friend_data = JSON.parse(req.body.friend_data);
      const userId = req.userId;
      const friendId = friend_data.id;

      if (message === 'Accept') {
        await User.updateOne(
          { _id: userId },
          {
            $push: { friends: friend_data },
            $pull: { incoming_reqs: { id: friendId } }
          }
        );

        await User.updateOne(
          { _id: friendId },
          {
            $push: {
              friends: {
                id: userId,
                username: friend_data.username,
                profile_pic: friend_data.profile_pic,
                tag: friend_data.tag
              }
            },
            $pull: { outgoing_reqs: { id: userId } }
          }
        );

        return res.status(200).json({ message: 'Friend added', status: 200 });
      } else {
        return res.status(200).json({ message: `Request ${message}`, status: 200 });
      }
    } catch (err) {
      console.error('❌ processRequest error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
];