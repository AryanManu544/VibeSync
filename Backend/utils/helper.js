const Username = require('../models/Username');

function generateTag(count) {
  const pad = '0000';
  const str = count.toString();
  return pad.substring(0, pad.length - str.length) + str;
}

async function isUsernameAvailable(username) {
  const data = await Username.findOne({ name: username });

  let count = 1;
  if (!data) {
    const newEntry = new Username({ name: username, count });
    await newEntry.save();
  } else {
    count = data.count + 1;
    await Username.updateOne({ name: username }, { $set: { count } });
  }

  return generateTag(count);
}

module.exports = {
  generateTag,
  isUsernameAvailable
};
