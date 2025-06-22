// /server/utils/passwordUtils.js
const bcrypt = require('bcryptjs');

// Hash password
async function hashPassword(plainPassword) {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}

// Compare password
async function comparePassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
