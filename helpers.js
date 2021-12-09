function getUserByEmail(email, users) {
  let usersArr = Object.values(users);

  for (let user of usersArr) {
    if (user.email === email) return user;
  }
  return undefined;
}

module.exports = { getUserByEmail };
