const User = require('../models/User');


function randomNumericTag(digits = 4) {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

async function isUsernameAvailable(username) {
  let tag;
  let clash;

  do {
    tag = randomNumericTag(4);
    clash = await User.exists({ username, tag });
  } while (clash);

  return tag;
}

module.exports = {
  isUsernameAvailable,
};
