const Server = require('../models/Server');

exports.addRole = async (req, res) => {
  const { server_id, role_name, permissions } = req.body;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    server.roles = server.roles || [];
    if (server.roles.some(role => role.role_name === role_name)) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    server.roles.push({ role_name, permissions });
    await server.save();
    res.status(200).json({ message: 'Role added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding role', error: err.message });
  }
};

exports.assignRole = async (req, res) => {
  const { server_id, user_id, role_name } = req.body;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    const user = server.users.find(u => u.user_id === user_id);
    if (!user) return res.status(404).json({ message: 'User not found in server' });

    user.user_role = role_name;
    await server.save();
    res.status(200).json({ message: 'Role assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error assigning role', error: err.message });
  }
};

exports.removeRole = async (req, res) => {
  const { server_id, user_id } = req.body;
  try {
    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    const user = server.users.find(u => u.user_id === user_id);
    if (!user) return res.status(404).json({ message: 'User not found in server' });

    user.user_role = '';
    await server.save();
    res.status(200).json({ message: 'Role removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing role', error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  const { server_id } = req.body;
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