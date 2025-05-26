const Server = require('../models/Server');
const mongoose = require('mongoose');
const User = require('../models/User');

exports.addRole = async (req, res) => {
  const { server_id, role_name, color = '#99AAB5', permissions } = req.body;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    server.roles = server.roles || [];
    if (server.roles.some(role => role.role_name === role_name)) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    server.roles.push({
      name:        role_name,
      color:       color,
      permissions,              // [ 'canDeleteChannels', ... ]
      id:          new mongoose.Types.ObjectId().toString()
    });
    await server.save();
    res.status(200).json({ message: 'Role added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding role', error: err.message });
  }
};

exports.assignRole = async (req, res) => {
  const { server_id, user_id, role_id } = req.body;
  console.log(`[assignRole] Request received: server_id=${server_id}, user_id=${user_id}, role_id=${role_id}`);

  try {
    const server = await Server.findById(server_id);
    if (!server) {
      console.log(`[assignRole] Server not found: ${server_id}`);
      return res.status(404).json({ message: 'Server not found' });
    }

    // Fix role ID check: compare role._id as string
    const roleExists = server.roles.some(r => r._id.toString() === role_id);
    if (!roleExists) {
      console.log(`[assignRole] Role not found in server roles: ${role_id}`);
      return res.status(404).json({ message: 'Role not found in server' });
    }

    const serverUserIndex = server.users.findIndex(u => u.user_id === user_id);
    if (serverUserIndex === -1) {
      console.log(`[assignRole] User not found in server users: ${user_id}`);
      return res.status(404).json({ message: 'User not found in server' });
    }

    const serverUser = server.users[serverUserIndex];
    if (!serverUser.role_ids) serverUser.role_ids = [];

    if (!serverUser.role_ids.includes(role_id)) {
      server.users[serverUserIndex].role_ids.push(role_id);
      console.log(`[assignRole] Role ${role_id} assigned to user ${user_id} in server`);
    } else {
      console.log(`[assignRole] User ${user_id} already has role ${role_id} in server`);
    }

    const user = await User.findById(user_id);
    if (!user) {
      console.log(`[assignRole] User not found in User collection: ${user_id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const userServerIndex = user.servers.findIndex(s => s.server_id === server_id);
    if (userServerIndex === -1) {
      console.log(`[assignRole] Server not found in user's servers: ${server_id}`);
      return res.status(404).json({ message: 'Server not found in user.servers' });
    }

    const userServer = user.servers[userServerIndex];
    if (!userServer.roles) userServer.roles = [];

    if (!userServer.roles.includes(role_id)) {
      user.servers[userServerIndex].roles.push(role_id);
      console.log(`[assignRole] Role ${role_id} assigned to user ${user_id} in user's server list`);
    } else {
      console.log(`[assignRole] Role ${role_id} already present for user ${user_id} in user's server list`);
    }

    server.markModified('users');
    user.markModified('servers');

    await server.save();
    await user.save();

    console.log(`[assignRole] Role assignment saved successfully for user ${user_id} in server ${server_id}`);
    res.status(200).json({ message: 'Role assigned successfully' });
  } catch (err) {
    console.error('[assignRole] Error assigning role:', err);
    res.status(500).json({ message: 'Error assigning role', error: err.message });
  }
};

exports.removeRole = async (req, res) => {
  const { server_id, user_id, role_id } = req.body;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    const user = server.users.find(u => u.user_id === user_id);
    if (!user) return res.status(404).json({ message: 'User not found in server' });

    user.role_ids = user.role_ids.filter(rid => rid.toString() !== role_id);

    await server.save();
    res.status(200).json({ message: 'Role removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing role', error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  const { server_id } = req.query;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    res.status(200).json({ roles: server.roles || [] });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving roles', error: err.message });
  }
};

exports.getUserRoles = async (req, res) => {
  const { server_id, user_id } = req.body;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    const user = server.users.find(u => u.user_id === user_id);
    if (!user) return res.status(404).json({ message: 'User not found in server' });

    res.status(200).json({ role: user.user_role || null });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user role', error: err.message });
  }
};