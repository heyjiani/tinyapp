  //// find user in database ////
  const findUserByEmail = (email, database) => {
    for (const userID in database) {
      const user = database[userID];
      if (user.email === email) return user;
    }
    return false;
  };



module.exports = findUserByEmail;
