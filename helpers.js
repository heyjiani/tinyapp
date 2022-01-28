//// GENERATE RANDOM ID ////
const generateRandomString = () => {
  return Math.random().toString(36).substring(3, 9);
};

//// FUNCTIONS FOR PERFORMING ACTIONS ON USER DATABASE ////
const generateUserHelpers = (users, bcrypt) => {

  //// find user in database ////
  const findUserByEmail = (email) => {
    for (const userID in users) {
      const user = users[userID];
      if (user.email === email) return user;
    }
  };

  //// return error if user email/password are not a match ////
  const authenticateUser = (user) => {
    const { email, password } = user;
    const foundUser = findUserByEmail(email);

    if (!foundUser) {
      return { error: "Email doesn't exist.", data: null };
    }

    if (!bcrypt.compareSync(password, foundUser.password)) {
      return { error: "Password doesn't match.", data: null };
    }

    return { error: null, data: foundUser };
  };

  //// add a new user, return error if criteria not met ////
  const addUser = (user) => {
    const { email, password } = user;

    if (!email || !password) {
      return { error: "Email and password cannot be blank!", data: null };
    }

    const foundUser = findUserByEmail(email);
    if (foundUser) {
      return { error: "An user with that email already exists!", data: null };
    }

    const userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password);

    const newUser = {id: userID, email, password: hashedPassword};
    users[userID] = newUser;

    return { error: null, data: newUser };
  };

  return { findUserByEmail, authenticateUser, addUser };
};

//// FUNCTIONS FOR PERFORMING ACTION ON URL DATABASE ////
const generateUrlHelpers = (urlDatabase) => {

  //// return URLs attached to specific user ID ////
  const urlsForUser = (id) => {
    const userURLs = {};
    for (const url in urlDatabase) {
      if (urlDatabase[url].userID === id) {
        userURLs[url] = {
          longURL: urlDatabase[url]["longURL"],
          userID: id
        };
      }
    }
    return userURLs;
  };

  //// determine if URL can be modified ////
  const modifyURL = (url, id) => {
    const { shortURL } = url;
    const { userID } = id;

    if (!urlDatabase[shortURL]) {
      return { error: "URL not found!", urlID: null };
    }

    if (!userID) {
      return { error: "You must be logged in to make changes to an URL!", urlID: null };
    }

    const userURLs = urlsForUser(userID, urlDatabase);
    if (!userURLs[shortURL]) {
      return { error: "You do not have permission to make changes to this URL!", urlID: null };
    }

    return { error: null, urlID: shortURL, userID, userURLs };
  };

  return { urlsForUser, modifyURL };
};


module.exports = {
  generateRandomString,
  generateUserHelpers,
  generateUrlHelpers
};
