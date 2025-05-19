const express = require('express')
const app = express()
const http = require('http')
require('dotenv').config()
const port = process.env.PORT || 4000;
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { Server } = require("socket.io");
const short_id = require('shortid');
const bcrypt = require('bcrypt');
app.use(cors())
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

const allowedOrigins = [
  'http://localhost:3000',
  'https://vibe-sync-glqp.vercel.app'
];

// Apply CORS to Express
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// mogoose config
const mongoose = require('mongoose');
const shortid = require('shortid');
mongoose.connect(process.env.MONGO_URI);

// user modal
var user_details = new mongoose.Schema({
  username: String,
  tag: String,
  email: String,
  password: String,
  profile_pic: String,
  servers: [{
    server_name: String,
    server_pic: String,
    server_role: String,
    server_id: String
  }],
  incoming_reqs: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String,
    status: String
  }],
  outgoing_reqs: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String,
    status: String
  }],
  friends: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String
  }],
  blocked: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String
  }],

  invites: [{
    server_id: String,
    invite_code: String,
    timestamp: String,
  }],
  dms: [
  {
    userId: String,
    name: String,
    tag: String,
    profile_pic: String
  }
]

})

var user_name_details = new mongoose.Schema({
  name: String,
  count: Number
})

var serverSchema = new mongoose.Schema({
  server_name: String,
  server_pic: String,
  users: [{
    user_name: String,
    user_profile_pic: String,
    user_tag: String,
    user_id: String,
    user_role: String
  }],
  categories: [{
    category_name: String,
    channels: [{
      channel_name: String,
      channel_type: String
    }]
  }],
  // will be false when server is deleted
  active: Boolean
})

var invites = new mongoose.Schema({
  invite_code: String,
  inviter_name: String,
  inviter_id: String,
  server_name: String,
  server_id: String,
  server_pic: String,
  timestamp: String,
})

// i could have directly used channel id as the key to search for the channel and didn't even used the server_id but ot would have increase the searching a lot  
// for example if there are 10 servers then each server must have atleast 2 channels and if thats the case it would make the search go for 20 documents but now just 10
var chats = new mongoose.Schema({
  server_id: String,
  channels: [{
    channel_id: String,
    channel_name: String,
    chat_details: [{
      content: String,
      sender_id: String,
      sender_name: String,
      sender_pic: String,
      sender_tag: String,
      timestamp: String
    }]
  }]
})
const dmChatSchema = new mongoose.Schema({
  participants: {
    type: [String],           // array of two user-IDs
    validate: arr => arr.length === 2
  },
  messages: [{
    senderId:    String,
    senderName:  String,
    senderPic:   String,
    content:     String,
    timestamp:   Number
  }]
}, { timestamps: true });

const DMChat = mongoose.model('discord_dmchats', dmChatSchema);
var user = mongoose.model('discord_user', user_details);
var username_details = mongoose.model('discord_username', user_name_details);
var servers = mongoose.model('discord_server', serverSchema);
var invites = mongoose.model('discord_invites', invites);
var chats = mongoose.model('discord_chats', chats);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// ****************  all the functions ****************************

// making transporter to send email
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: process.env.user,
    pass: process.env.password
  }
});

function isusername_available(username) {
  return new Promise((resolve, reject) => {
    username_details.find({ name: username }, function (err, data) {
      var count_value = 0;
      if (err) {
        console.log('here is the error')
      }
      else {
        if (data.length == 0) {
          //  var add_user_name = { $push: {user_name:[{name:username , count:1}]}}
          var count_value = 1
          var add_new_username = new username_details({ name: username, count: 1 });

          // here we saved users details
          add_new_username.save(function (err_2, data_2) {
            if (err_2) return console.error(err_2);
            else { console.log(data_2) }
          });
        }
        else {
          var count_value = data[0].count + 1
          var add_user_name = { $set: { name: username, count: count_value } }
          username_details.updateOne({ name: username }, add_user_name, function (err, result) {
            if (err) console.log(err)
            else {
            }
          })
        }
        const final_tag = generatetag(count_value)

        const value = { message: 'data saved', status: 201, final_tag: final_tag }
        resolve(value);

      }
    })
  })

}

function signup(email, username, password) {
  return new Promise((resolve, reject) => {
    user.find({ email: email }, function (err, data) {
      if (data.length == 0) {
        // this if condition validates the form in case js is off in some browser it also checks if password length is less than 7
        if (username == '' || email == '' || password == '') {
          console.log('entries wrong')
          const response = { message: 'wrong input', status: 204 };
          resolve(response);
        }
        else if (password && password.length < 7) {
          console.log('password length not enough')
          const response = { message: 'password length', status: 400 };
          resolve(response);
        }
        else {
          const response = { message: true };
          resolve(response);
        }
      }
      else {
        if (data[0].authorized == true) {
          console.log('user already exists')
          const response = { message: 'user already exists', status: 202 };
          resolve(response);
          // res.status(202).json({message:'user already exists' , status : 202})
        }
      }
    })
  })

}

function generatetag(count_value) {
  var default_value = '0000'
  var count_value_str = count_value.toString();
  var count_length = count_value_str.length;
  var final_str_1 = default_value.slice(0, default_value.length - count_length)
  var final_str = final_str_1 + count_value_str;
  return final_str;
}

// **************** server functions *********************

function add_server_to_user(id, server_details, server_role) {
  return new Promise((resolve, reject) => {

    const { server_name, server_pic, server_id } = server_details

    var update_user_details = {
      $push: {
        servers: [{ server_name: server_name, server_pic: server_pic, server_role: server_role, server_id: server_id }]
      }
    }

    user.updateOne({ _id: id }, update_user_details, function (err, data) {
      if (err) console.log(err)
      else {
        resolve(true)
      }
    })


  })
}

function template(user_details, server_details, image) {
  ``
  return new Promise((resolve, reject) => {
    const { name, type, key, role } = server_details
    const { id, username, tag, profile_pic } = user_details

    let server_template = ''

    if (key == 2) {
      server_template = new servers({
        server_name: name,
        server_pic: image,
        users: [{
          user_name: username,
          user_profile_pic: profile_pic,
          user_tag: tag,
          user_role: role,
          user_id: id
        }],
        categories: [{
          category_name: 'Text Channels',
          channels: [{
            channel_name: 'general',
            channel_type: 'text'
          },
          {
            channel_name: 'Clips and Highlights',
            channel_type: 'text'
          }]
        },
        {
          category_name: 'Voice Channels',
          channels: [{
            channel_name: 'Lobby',
            channel_type: 'voice'
          },
          {
            channel_name: 'Gaming',
            channel_type: 'voice'
          }]
        }
        ]
      })
    }

    else if (key == 3) {
      server_template = new servers({
        server_name: name,
        server_pic: image,
        users: [{
          user_name: username,
          user_profile_pic: profile_pic,
          user_tag: tag,
          user_role: role,
          user_id: id
        }],
        categories: [{
          category_name: 'INFORMATION',
          channels: [{
            channel_name: 'welcome and rules',
            channel_type: 'text'
          },
          {
            channel_name: 'announcements',
            channel_type: 'text'
          },
          {
            channel_name: 'resources',
            channel_type: 'text'
          },
          {
            channel_name: 'qwerty',
            channel_type: 'text'
          }]
        },
        {
          category_name: 'Voice Channels',
          channels: [{
            channel_name: 'Lounge',
            channel_type: 'voice'
          },
          {
            channel_name: 'Meeting Room 1',
            channel_type: 'voice'
          },
          {
            channel_name: 'Meeting Room 2',
            channel_type: 'voice'
          }]
        },
        {
          category_name: 'TEXT CHANNELS',
          channels: [{
            channel_name: 'general',
            channel_type: 'text'
          },
          {
            channel_name: 'meeting-plan',
            channel_type: 'text'
          },
          {
            channel_name: 'off-topic',
            channel_type: 'text'
          }]
        }
        ]
      })
    }

    else {
      server_template = new servers({
        server_name: name,
        server_pic: image,
        users: [{
          user_name: username,
          user_profile_pic: profile_pic,
          user_tag: tag,
          user_role: role,
          user_id: id
        }],
        categories: [{
          category_name: 'Text Channels',
          channels: [{
            channel_name: 'general',
            channel_type: 'text'
          }]
        },
        {
          category_name: 'Voice Channels',
          channels: [{
            channel_name: 'general',
            channel_type: 'voice'
          }]
        }
        ]
      })
    }

    server_template.save(function (err_2, data_2) {
      if (err_2) return console.error(err_2);
      else {
        resolve({ server_name: name, server_pic: image, server_id: data_2._id })
      }
    });


  })

}

function add_user_to_server(user_details, server_id) {
  const { username, tag, id, profile_pic } = user_details

  return new Promise((resolve, reject) => {

    // for appending in user details
    let new_user_to_server = {
      $push: {
        users: [{
          user_name: username,
          user_profile_pic: profile_pic,
          user_tag: tag,
          user_role: 'member',
          user_id: id
        }]
      }
    };

    servers.updateOne({ _id: server_id }, new_user_to_server, function (err, data) {
      if (err) console.log(err)
      else {
        if (data.modifiedCount > 0) {
          resolve(true)
        }
      }
    })

  })
}

function check_server_in_user(id, server_id) {
  return new Promise((resolve, reject) => {
    user.aggregate([
      {
        "$match": {
          "_id": new mongoose.Types.ObjectId(id)
        }
      },

      {
        "$project": {

          "servers": {

            "$filter": {
              "input": "$servers",
              "as": "server",
              "cond": { "$eq": ["$$server.server_id", server_id] }
            }
          }
        }
      }],

      function (err, data) {
        if (err) console.log(err)
        else {
          resolve(data)

        }
      })
  })
}

// ************* invite function **********************

function check_invite_link(inviter_id, server_id) {
  return new Promise((resolve, reject) => {
    user.aggregate([
      {
        "$match": {
          "_id": new mongoose.Types.ObjectId(inviter_id)
        }
      },

      {
        "$project": {

          "invites": {

            "$filter": {
              "input": "$invites",
              "as": "invite",
              "cond": { "$eq": ["$$invite.server_id", server_id] }
            }
          }
        }
      }],

      function (err, data) {
        if (err) console.log(err)
        else {
          resolve(data)

        }
      })
  })
}

// ************** Friend request functions*******************

function check_req(ids, user_id) {
  if (ids.length != 0) {
    for (let i = 0; i < ids.length; i++) {
      if (user_id == ids[i].id) {
        return true
      }
      else {
        return false
      }
    }
  }
  else {
    return false
  }
}

function add_friend(user_data, friend_data) {
  const { friend_id, friend_username, friend_tag, friend_profile_pic } = friend_data
  const { id, username, tag, profile_pic } = user_data

  return new Promise((resolve, reject) => {
    // console.log('adding friend....')
    let user_friends_list = {
      $push: {
        friends: [{
          id: friend_id,
          username: friend_username,
          profile_pic: friend_profile_pic,
          tag: friend_tag,
        }]
      }
    };

    let friend_friends_list = {
      $push: {
        friends: [{
          id: id,
          username: username,
          profile_pic: profile_pic,
          tag: tag,
        }]
      }
    };

    // for reciever's db delete request from incoming field
    let delete_incoming = { $pull: { incoming_reqs: { id: friend_id } } };

    // for sender's db delete request from outgoing field
    let delete_outgoing = { $pull: { outgoing_reqs: { id: id } } };

    let param_arr = [user_friends_list, friend_friends_list]
    let param_arr_2 = [delete_incoming, delete_outgoing]
    let id_arr = [id, friend_id]

    for (let i = 0; i < 2; i++) {
      user.updateOne({ _id: id_arr[i] }, param_arr[i], function (err, result) {
        if (err) {
          reject({ message: 'something went wrong', status: 404 })
          throw err;
        }
      });

      user.updateOne({ _id: id_arr[i] }, param_arr_2[i], function (err, result) {
        if (err) {
          reject({ message: 'something went wrong', status: 404 })
          console.log(err)
        }
      })
    }
    resolve({ message: 'friend added', status: 200 })
  })
}

// ************** chat functions*******************
function create_chat(server_id) {
  return new Promise((resolve, reject) => {
    var add_chats = new chats({
      server_id: server_id,
    });

    // here we create a new chat document
    add_chats.save(function (err, data) {
      if (err) return console.error(err);
      else {
        console.log('new chat created')
        resolve({ status: 200 })
      }
    });
  })
}

function get_chats(server_id, channel_id) {
  return new Promise((resolve, reject) => {
    chats.aggregate([
      {
        "$match": {
          "server_id": server_id
        }
      },

      {
        "$project": {

          "channels": {

            "$filter": {
              "input": "$channels",
              "as": "channel",
              "cond": { "$eq": ["$$channel.channel_id", channel_id] }
            }
          }
        }
      }],

      function (err, data) {
        if (err) console.log(err)
        else {
          resolve(data)
        }
      })
  })
}

// ************** auth function******************

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

app.post('/verify_route', authToken, (req, res) => {
  res.status(201).json({ message: 'authorized', status: 201 });
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const DEFAULT_PIC = process.env.DEFAULT_PROFILE_PIC;
console.log('>>> DEFAULT_PROFILE_PIC is:', DEFAULT_PIC);

app.post('/register', async (req, res) => {
  console.log('🟢 /register hit! body =', req.body);

  const { email, username, password, profile_pic } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Missing fields', status: 400 });
  }

  try {
    const response = await signup(email, username, password);
    if ([204, 400, 202].includes(response.status)) {
      return res
        .status(response.status)
        .json({ message: response.message, status: response.status });
    }

    if (response.message === true) {
      const { final_tag } = await isusername_available(username);
      const hashedPwd = await bcrypt.hash(password, 12);

      const newUser = new user({
        username,
        tag: final_tag,
        profile_pic: profile_pic?.startsWith("data:image/") ? profile_pic : DEFAULT_PIC,
        email,
        password: hashedPwd,
      });

      const saved = await newUser.save();
      console.log('✅ Saved user:', saved);

      return res
        .status(201)
        .json({ message: 'User created!', status: 201, user: saved });
    }

    // ...other flows
  } catch (err) {
    console.error('❌ /register error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }

});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const userData = await user.findOne({ email });

    if (!userData) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      console.log("❌ Password did not match for:", email);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: userData._id,
        username: userData.username,
        tag: userData.tag,
        profile_pic: userData.profile_pic,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: '1h' }
    );

    console.log("✅ Login successful for", email);

    return res.status(200).json({
      token,
      user: {
        id: userData._id,
        username: userData.username,
        tag: userData.tag,
        profile_pic: userData.profile_pic,
        incoming_reqs: userData.incoming_reqs || [],
        outgoing_reqs: userData.outgoing_reqs || [],
        blocked: userData.blocked || [],
        friends: userData.friends || [],
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: 'Server error' });
  }
});



app.post('/add_friend', async function (req, res) {
  let friend = req.body.friend
  let friend_length = friend.length
  let hash_index = friend.indexOf("#");
  if (hash_index == -1) {
    res.status(400).json({ message: 'Invalid Input', status: 400 });
  }
  else {
    let name = friend.slice(0, hash_index)
    let user_tag = friend.slice(hash_index + 1, friend_length)
    const authHeader = req.headers['x-auth-token']
    const user_id = jwt.verify(authHeader, process.env.ACCESS_TOKEN);

    const { id, username, tag, profile_pic } = user_id

    const isuserexists = new Promise((resolve, reject) => {
      user.find({ username: name, tag: user_tag }, function (err, data) {
        if (err) {
          reject(err, 'something wrong in add_friend endpoint')
        }
        else {
          if (data.length == 0) {
            resolve(false)
          }
          else {
            // console.log(data[0].incoming_reqs)
            resolve({
              response: true, friend_id: data[0].id, friend_username: data[0].username, friend_tag: data[0].tag, friend_profile_pic: data[0].profile_pic, outgoing_reqs: data[0].outgoing_reqs, incoming_reqs: data[0].incoming_reqs,
              friends: data[0].friends
            })
          }
        }
      }).clone()
    })

    let result = await isuserexists

    const { incoming_reqs, outgoing_reqs, friends, response, friend_id, friend_username, friend_tag, friend_profile_pic } = result


    if (response == false) {
      res.status(404).json({ message: 'User Not found', status: 404 });
    }
    else {
      const friend_list = check_req(friends, id)

      if (friend_list == true) {
        console.log('already friends')
        res.status(201).json({ message: 'You are already friends with this user', status: 201 });
      }
      else {
        const outgoing_list = check_req(outgoing_reqs, id)
        if (outgoing_list == true) {
          const response = await add_friend(user_id, result)
          console.log('friends now')
          // here we will add that user to friend list and not send the request again , this message is only for user simplicity
          res.status(201).json({ message: 'Request sent successfully', status: 201 });
        }
        else {
          const incoming_list = check_req(incoming_reqs, id)
          if (incoming_list == true) {
            console.log('request alreay sent')
            res.status(202).json({ message: 'Request already sent', status: 202 });
          }
          else {
            let sending_req = {
              $push: {
                'incoming_reqs': [{
                  // got these after destructuring the object user_id
                  id: id,
                  username: username,
                  profile_pic: profile_pic,
                  tag: tag,
                  status: 'incoming'
                }]
              }
            };

            let sending_req_2 = {
              $push: {
                'outgoing_reqs': [{
                  id: friend_id,
                  username: friend_username,
                  profile_pic: friend_profile_pic,
                  tag: friend_tag,
                  status: 'outgoing'
                }]
              }
            };


            if (response == true) {
              // this update will be done in the data of the receiveing user
              user.updateOne({ _id: friend_id }, sending_req, function (err, result) {
                if (err) throw err;
                else {
                  // console.log('request sent')
                }
              });

              // this update will be done in the data of the sending user
              user.updateOne({ _id: id }, sending_req_2, function (err, result) {
                if (err) throw err;
              });
            }
            res.status(203).json({ message: 'Request sent successfully', status: 203, receiver_id: friend_id });
          }
        }
      }
    }
  }

})

app.get('/user_relations', async function (req, res) {
  try {
    const authHeader = req.headers['x-auth-token'];
    const user_id = jwt.verify(authHeader, process.env.ACCESS_TOKEN);
    
    const result = await user.findOne({ _id: user_id.id })
      .select('incoming_reqs outgoing_reqs friends blocked servers')
      .lean();

    if (!result) {
      return res.status(404).json({ message: 'User not found', status: 404 });
    }

    // Transform data to match frontend expectations
    const response = {
      incoming_requests: result.incoming_reqs?.map(req => ({
        id: req.id,
        username: req.username,
        profile_pic: req.profile_pic,
        tag: req.tag,
        status: 'incoming'
      })) || [],
      outgoing_requests: result.outgoing_reqs?.map(req => ({
        id: req.id,
        username: req.username,
        profile_pic: req.profile_pic,
        tag: req.tag,
        status: 'outgoing'
      })) || [],
      friends: result.friends || [],
      blocked: result.blocked || [],
      servers: result.servers || []
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /user_relations:', error);
    res.status(500).json({ message: 'Internal server error', status: 500 });
  }
});

app.post('/process_req', async function (req, res) {
  const { message, friend_data } = req.body
  const { id, profile_pic, tag, username } = friend_data
  final_friend_data = { friend_id: id, friend_profile_pic: profile_pic, friend_tag: tag, friend_username: username }
  // had to transfer the friend data to final friend data because in the function add_friend i am using destructuring and keys have to be according to that

  const authHeader = req.headers['x-auth-token']
  const user_id = jwt.verify(authHeader, process.env.ACCESS_TOKEN);
  if (message == 'Accept') {
    const result = await add_friend(user_id, final_friend_data)
    const { message, status } = result
    res.status(status).json({ message: message, status: status });
  }
  else if (message == 'Ignore') {
    console.log('will do something about ignore')
  }
  else if (message == 'Unblock') {
    console.log('will do something about Unblock')
  }
  else if (message == 'Cancel') {
    console.log('will do something about Cancel')
  }
})

app.post('/create_dm', authToken, async (req, res) => {
  try {
    const senderId = req.userId;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'Invalid participants', status: 400 });
    }

    const allParticipants = [senderId, ...participantIds].sort();

    // Check if DM already exists
    const existing = await DMChat.findOne({ participants: allParticipants });
    if (existing) {
      return res.json({ status: 200, message: 'Already exists', dmId: existing._id });
    }

    // Create new DM
    const newDM = await DMChat.create({
      participants: allParticipants,
      messages: []
    });

    // Get user info for each participant (for storing in DM list)
    const users = await user.find({ _id: { $in: allParticipants } });

    for (const uid of allParticipants) {
      const currentUser = users.find(u => u._id.toString() === uid);
      const others = users.filter(u => u._id.toString() !== uid);

      const dmEntries = others.map(u => ({
        userId: u._id,
        name: u.name || u.username,
        tag: u.tag,
        profile_pic: u.profile_pic || ''
      }));

      await user.findByIdAndUpdate(uid, {
        $addToSet: {
          dms: { $each: dmEntries }
        }
      });
    }

    return res.json({ status: 201, message: 'DM created', dmId: newDM._id });

  } catch (err) {
    console.error('❌ /create_dm error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }
});
// Add this in your backend
app.get('/get_dms', authToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find all DMs that include this user
    const dms = await DMChat.find({ participants: userId });

    // Fetch user info for each DM participant (excluding the user themselves)
    const usersCollection = await user.find({});
    const dmList = [];

    for (const dm of dms) {
      const otherUserId = dm.participants.find(id => id !== userId);
      const otherUser = usersCollection.find(u => u._id.toString() === otherUserId);

      if (otherUser) {
        dmList.push({
          id: otherUser._id.toString(),
          name: otherUser.name,
          tag: otherUser.tag,
          profile_pic: otherUser.profile_pic || null,
        });
      }
    }

    return res.json({ status: 200, dms: dmList });
  } catch (err) {
    console.error('❌ /get_dms error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});



app.post('/create_server', async function (req, res) {
  const { name, type, key, role } = req.body.server_details
  const authHeader = req.headers['x-auth-token']
  const user_id = jwt.verify(authHeader, process.env.ACCESS_TOKEN);

  // create a server in the servers collection
  const server_template = await template(user_id, req.body.server_details, req.body.server_image)

  // create a chat collection 
  const add_new_chat = await create_chat(server_template.server_id)

  if (add_new_chat.status == 200) {
    // adds server details in user document
    const add_server = await add_server_to_user(user_id.id, server_template, role)

    if (add_server == true) {
      res.json({ status: 200, message: 'Server Created' })
    }
    else {
      res.json({ status: 500, message: 'Somethig Went Wrong' })
    }
  }

  else {
    res.json({ status: 500, message: 'Somethig Went Wrong' })
  }


})

app.post('/get_user_by_id', authToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: 400, message: 'Missing ID' });

    const userData = await user.findOne({ _id: id }, 'username profile_pic tag');
    if (!userData) return res.status(404).json({ status: 404, message: 'User not found' });

    return res.json({
      status: 200,
      user: {
        id: userData._id,
        name: userData.username,
        profile_pic: userData.profile_pic,
        tag: userData.tag
      }
    });
  } catch (err) {
    console.error('❌ /get_user_by_id error:', err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
});


app.post('/server_info', async function (req, res) {
  const server_id = req.body.server_id
  const authHeader = req.headers['x-auth-token']
  const user_id = jwt.verify(authHeader, process.env.ACCESS_TOKEN);

  const response = await check_server_in_user(user_id.id, server_id)

  if (response == []) {
    res.json({ status: 404, message: 'you are not authorized' })
  }
  else {
    const server_info = await servers.find({ _id: new mongoose.Types.ObjectId(server_id) })
    res.json(server_info)
  }

})

app.post('/add_new_channel', function (req, res) {
  const { category_id, channel_name, channel_type, server_id } = req.body
  var new_channel = {
    $push: {
      'categories.$.channels': { channel_name: channel_name, channel_type: channel_type }
    }
  }

  servers.updateOne({ _id: new mongoose.Types.ObjectId(server_id), 'categories._id': new mongoose.Types.ObjectId(category_id) }, new_channel, function (err, data) {
    if (err) console.log(err)
    else {
      if (data.modifiedCount > 0) {
        res.json({ status: 200 })
      }
    }
  })
})

app.post('/add_new_category', function (req, res) {
  const { category_name, server_id } = req.body
  var new_category = {
    $push: {
      'categories': { category_name: category_name, channels: [] }
    }
  }

  servers.updateOne({ _id: new mongoose.Types.ObjectId(server_id) }, new_category, function (err, data) {
    if (err) console.log(err)
    else {
      if (data.modifiedCount > 0) {
        res.json({ status: 200 })
      }
    }
  })

})
app.post('/delete_channel', async (req, res) => {
  const { server_id, channel_id } = req.body;

  // basic ObjectId validation...
  if (!mongoose.isValidObjectId(server_id) || !mongoose.isValidObjectId(channel_id)) {
    return res.status(400).json({ status: 400, message: 'Invalid IDs' });
  }

  const result = await servers.updateOne(
    { _id: server_id },
    { $pull: { 'categories.$[].channels': { _id: channel_id } } }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ status: 404, message: 'Channel not found' });
  }

  return res.json({ status: 200, message: 'Channel deleted' });
});

app.post('/create_invite_link', async function (req, res) {
  const { inviter_name, inviter_id, server_name, server_id, server_pic } = req.body

  let response = await check_invite_link(inviter_id, server_id)

  if (response[0].invites == null || response[0].invites.length == 0) {
    const timestamp = Date.now()
    const invite_code = short_id()

    // for appending in invites collection
    var add_new_invite_link = new invites({
      invite_code: invite_code,
      inviter_name: inviter_name,
      inviter_id: inviter_id,
      server_name: server_name,
      server_id: server_id,
      server_pic: server_pic,
      timestamp: timestamp
    });

    add_new_invite_link.save(function (err_2, data_2) {
      if (err_2) return console.error(err_2);
      else { console.log('added to invites collection') }
    });

    // for appending in user details
    let user_invites_list = {
      $push: {
        invites: [{
          server_id: server_id,
          invite_code: invite_code,
          timestamp: timestamp,
        }]
      }
    };

    user.updateOne({ "_id": new mongoose.Types.ObjectId(inviter_id) }, user_invites_list, function (err, data) {
      if (err) console.log(err)
      else {
        if (data.modifiedCount > 0) {
          console.log('successfully updated invites')
        }
      }
    })
    res.json({ status: 200, invite_code: invite_code })
  }
  else {
    res.json({ status: 200, invite_code: response[0].invites[0].invite_code })
  }
})

app.post('/invite_link_info', function (req, res) {
  const invite_link = req.body.invite_link
  invites.find({ invite_code: invite_link }, function (err, data) {
    if (err) console.log(err)
    else {
      if (data.length == 1) {
        const { inviter_name, server_name, server_pic, server_id, inviter_id } = data[0]
        res.json({ status: 200, inviter_name, server_name, server_pic, server_id, inviter_id })
      }
      else {
        res.json({ status: 404 })
      }
    }
  })
})

app.post('/accept_invite', async function (req, res) {
  const { user_details, server_details } = req.body
  const { username, tag, id, profile_pic } = user_details

  const server_id = server_details.invite_details.server_id

  const check_user = await check_server_in_user(id, server_id);

  if (check_user[0].servers.length == 0) {
    // adds user details to the server docuemnt
    const add_user = await add_user_to_server(user_details, server_id)

    // adds server details in user document
    if (add_user == true) {
      const add_server = await add_server_to_user(id, server_details.invite_details, 'member')
      res.json({ status: 200 })
    }
    else {
      console.log('something went wrong in add_user')
    }

    console.log('user added to server')
  }
  else {
    console.log('user is already in server')
    res.json({ status: 403 })
  }

})

app.get('/get_friends', authToken, async (req, res) => {
  try {
    const foundUser = await user.findOne({ _id: req.userId });

    if (!foundUser || !foundUser.friends) {
      return res.json({ friends: [] });
    }

    return res.json({ friends: foundUser.friends });
  } catch (err) {
    console.error('❌ /get_friends error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/delete_server', function (req, res) {
  const server_id = req.body.server_id

  var delete_server = { $set: { active: false } }

  servers.updateOne({ _id: server_id }, delete_server, function (err, data) {
    if (err) console.log(err)
    else {
      if (data.modifiedCount > 0) {
        console.log('deleted the server from servers')
      }
    }
  })

  var delete_server_from_user = { $pull: { servers: { server_id: server_id } } }

  user.updateMany({ 'servers.server_id': server_id }, delete_server_from_user, function (err, data) {
    if (err) console.log(err)
    else {
      if (data.modifiedCount > 0) {
        console.log('deleted the server from userss')
        res.json({ status: 200 })
      }
    }
  })

})

app.post('/leave_server', function (req, res) {
  console.log('enterd in leave')
  const server_id = req.body.server_id
  const authHeader = req.headers['x-auth-token']
  const user_id = jwt.verify(authHeader, process.env.ACCESS_TOKEN);


  var leave_server = { $pull: { servers: { server_id: server_id } } }

  user.updateOne({ _id: user_id.id }, leave_server, function (err, data) {
    if (err) console.log(err)
    else {
      console.log(data)
      if (data.modifiedCount > 0) {
        console.log('deleted server from user')
      }
    }
  })

  var delete_user_from_server = { $pull: { users: { user_id: user_id.id } } }

  servers.updateOne({ _id: server_id }, delete_user_from_server, function (err, data) {
    if (err) console.log(err)
    else {
      if (data.modifiedCount > 0) {
        console.log('deleted user from server')
        res.json({ status: 200 })
      }
    }
  })

})

app.post('/store_message', async function (req, res) {
  const { message, server_id, channel_id, channel_name, timestamp, username, tag, id, profile_pic } = req.body
  console.log(channel_name, channel_id)

  const response = await chats.find({ server_id: server_id, 'channels.channel_id': channel_id })

  if (response.length == 0) {
    var push_new_channel = {
      $push: {
        channels: [{
          channel_id: channel_id,
          channel_name: channel_name,
          chat_details: [{
            content: message,
            sender_id: id,
            sender_name: username,
            sender_pic: profile_pic,
            sender_tag: tag,
            timestamp: timestamp,
          }]
        }]
      }
    }

    chats.updateOne({ server_id: server_id }, push_new_channel, function (err, data) {
      if (err) console.log(err)
      else {
        console.log(data)
        if (data.modifiedCount > 0) {
          console.log('channel added in chat')
          res.json({ status: 200 })
        }
      }
    })

  }

  else {

    var push_new_chat = {
      $push: {
        'channels.$.chat_details': [{
          content: message,
          sender_id: id,
          sender_name: username,
          sender_pic: profile_pic,
          sender_tag: tag,
          timestamp: timestamp
        }]
      }
    }

    // > db.demo710.find().sort({$natural:-1});  return the output in oppposite order
    chats.updateOne({ 'channels.channel_id': channel_id }, push_new_chat, function (err, data) {
      if (err) console.log(err)
      else {
        if (data.modifiedCount > 0) {
          console.log('chat added')
          res.json({ status: 200 })
        }
      }
    })

  }

})
app.post('/get_messages' , async function(req,res){
  const {channel_id, server_id} = req.body

  let response = await get_chats(server_id , channel_id)
  
  if(response[0].channels.length!=0){
    res.json({chats:response[0].channels[0].chat_details})
  }
  else{
    res.json({chats:[]})
  }
})

app.post('/store_dm_message', authToken, async (req, res) => {
  console.log('🟢 /store_dm_message body =', req.body);
  try {
    const { to, content, timestamp } = req.body;
    const senderId = req.userId;
    if (!to || !content || !timestamp) {
      return res.status(400).json({ message: 'Missing fields', status: 400 });
    }

    const msg = {
      senderId,
      senderName: req.body.senderName,
      senderPic: req.body.senderPic,
      content,
      timestamp,
    };

    // Always sort so [A,B] === [B,A]
    const participants = [senderId, to].sort();

    // Upsert and return document
    const updated = await DMChat.findOneAndUpdate(
      { participants },
      { $push: { messages: msg }, $setOnInsert: { participants } },
      { upsert: true, new: true }
    );

    console.log('✅ store_dm_message updated doc:', updated);
    return res.json({ message: 'DM stored', status: 200 });
  } catch (err) {
    console.error('❌ /store_dm_message error:', err);
    return res.status(500).json({ message: 'Server error', status: 500 });
  }
});

app.post('/get_dm_history', authToken, async (req, res) => {
  console.log('🟢 /get_dm_history body =', req.body);
  try {
    const { user2 } = req.body;
    const user1 = req.userId;
    if (!user2) {
      return res.status(400).json({ error: 'Missing user2', history: [] });
    }

    const participants = [user1, user2].sort();

    const chatDoc = await DMChat.findOneAndUpdate(
      { participants },
      { $setOnInsert: { participants, messages: [] } },
      { upsert: true, new: true }
    );

    console.log('✅ get_dm_history returning messages:', chatDoc.messages.length);
    return res.json({ history: chatDoc.messages });
  } catch (err) {
    console.error('❌ /get_dm_history error:', err);
    return res.status(500).json({ error: 'Server error', history: [] });
  }
});

app.post('/edit_dm_message', authToken, async (req, res) => {
  const { peerId, timestamp, newContent } = req.body;
  if (!peerId || !timestamp || !newContent) {
    return res.status(400).json({ message:'Missing fields', status:400 });
  }
  const participants = [req.userId, peerId].sort();
  const result = await DMChat.updateOne(
    { participants, 'messages.senderId': req.userId, 'messages.timestamp': timestamp },
    { $set: { 'messages.$.content': newContent, 'messages.$.edited': true } }
  );
  if (result.modifiedCount === 0) {
    return res.status(404).json({ message:'Not found or not yours', status:404 });
  }
  res.json({ message:'Edited', status:200 });
});

app.post('/delete_dm_message', authToken, async (req, res) => {
  const { peerId, timestamp } = req.body;
  if (!peerId || !timestamp) {
    return res.status(400).json({ message:'Missing fields', status:400 });
  }
  const participants = [req.userId, peerId].sort();
  const result = await DMChat.updateOne(
    { participants },
    { $pull: { messages: { senderId:req.userId, timestamp } } }
  );
  if (result.modifiedCount === 0) {
    return res.status(404).json({ message:'Not found or not yours', status:404 });
  }
  res.json({ message:'Deleted', status:200 });
});

const server = app.listen(port, () => {
  console.log(`listening on port ${port}`)
})



const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 20000
});

io.on("connection", (socket) => {
  socket.on('get_userid', (user_id) => {
    socket.join(user_id)
  })

  socket.on('send_req', (receiver_id, sender_id, sender_profile_pic, sender_name) => {
    socket.to(receiver_id).emit('recieve_req', { sender_name: sender_name, sender_profile_pic: sender_profile_pic, sender_id })
  })

  socket.on('req_accepted', (sender_id, friend_id, friend_name, friend_profile_pic) => {
    socket.to(friend_id).emit('req_accepted_notif', { sender_id, friend_name: friend_name, friend_profile_pic: friend_profile_pic })
  })

  socket.on('join_chat', (channel_id) => {
    socket.join(channel_id)
  })

  socket.on('send_message', (channel_id, message, timestamp, sender_name, sender_tag, sender_pic) => {
    socket.to(channel_id).emit('recieve_message', { message_data: { message, timestamp, sender_name, sender_tag, sender_pic } })
  })

});