function getUserByEmail(email, users) {
  let usersArr = Object.values(users);

  for (let user of usersArr) {
    if (user.email === email) return user;
  }
  return undefined;
}

function accessCheck(urlData, user_id) {
  let invalidAccess = false;
  const accessDenialHandler = function(res, urlData, user_id) {
    if (!urlData) {
      res.status(400).send('400 - Invalid short URL');
    } else if (!user_id) {
      res.status(400).send('400 - Please login to see your URLs');
    } else if (urlData.user_id !== user_id) {
      res.status(400).send('400 - Access restricted. Please log onto the correct account to view this URL');
    }
  };
  if (!urlData || !user_id || urlData.user_id !== user_id) {
    invalidAccess = true;
  }
  return { invalidAccess, accessDenialHandler };
}

module.exports = { getUserByEmail, accessCheck };
