  //// generate random id ////
function generateRandomString() {
  return Math.random().toString(36).substring(3, 9);
}

//// find user in database ////
const findUserByEmail = (email, database) => {
  for (const userID in database) {
    const user = database[userID];
    if (user.email === email) return user;
  }
};

//// return URLs attached to specific user ID ////
const urlsForUser = (id, database) => {
  const userURLs = {};
  for (const url in database) {
    if (database[url].userID === id) {
      userURLs[url] = {
        longURL: database[url]["longURL"],
        userID: id
      }
    }
  }
  return userURLs;
};

module.exports = {
  generateRandomString,
  findUserByEmail,
  urlsForUser
};
