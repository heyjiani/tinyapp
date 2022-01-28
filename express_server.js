const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { findUserByEmail } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { urlsForUser } = require('./helpers');
// const { authenticateUser } = require('./helpers');

//// implement middleware ////
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["swiss cheese plant under the sun", "monstera adansonii"]
}))

app.set("view engine", "ejs");

//// DATABASE ////

const urlDatabase = {
  "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca",
      userID: "abCd12"
  },
  "9sm5xK": {
      longURL: "http://www.google.com",
      userID: "haha67"
  }
};

const users = {
  "abCd12": {
    id: "abCd12", 
    email: "trixie@example.com", 
    password: bcrypt.hashSync("barbie")
  },
 "haha67": {
    id: "haha67", 
    email: "katya@example.com", 
    password: bcrypt.hashSync("dishwasher-funk")
  }
};


//// return error if user email/password are not a match ////
const authenticateUser = (user, password) => {
  if (!user) {
    return { error: "Email doesn't exist.", data: null };
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return { error: "Password doesn't match.", data: null };
  }

  return { error: null, data: user };
};


/* ///ROUTES/// */

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//// MAIN URL PAGE ////
app.get("/urls", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(401).send(
      `<html><h3>You must <a href="http://localhost:8080/login">log in</a> to see this page!</h2></html>`
    );
  } 

  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[userID],
    urls: userURLs
  };

  return res.render("urls_index", templateVars);
});

//// CREATE NEW SHORT URL ////
app.get("/urls/new", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  // console.log('TEST--userID: ', userID);
  if (!userID) {
    return res.redirect("/login");
  } 

  return res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  if (!userID) {
    return res.status("403").send("Access Denied: Please log in first!\n");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID
  };
  // console.log(`URL Database:`, urlDatabase);
  return res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status("404").send("OOPS! Looks like the link does not exist.");
  } 

  const longURL = urlDatabase[shortURL]["longURL"];
  return res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;

  if (!userID) {
    return res.send(`<html>You must <a href="http://localhost:8080/login">log in</a> to see this page!</html>`)
  } 

  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(userID, urlDatabase);

  if (!userURLs[shortURL]) {
    return res.status("404").send("Page not found!")
  }

  const templateVars = {
    user: users[userID],
    shortURL: shortURL,
    longURL: userURLs[shortURL]["longURL"]
  };
  return res.render("urls_show", templateVars)
});

//// DELETE URL ////
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('URL not found!\n');
  }

  if (!userID) {
    return res.status(403).send(`You must be logged in to edit an URL!\n`);
  }

  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) {
    return res.status(403).send(`You do not have permission to edit this URL!\n`);
  }

  delete urlDatabase[shortURL];
  return res.redirect("/urls");
});

//// EDIT URL ////
app.post("/urls/:id", (req, res) => {
  const urlID = req.params.id;
  const newURL = req.body.newURL;
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;

  if (!urlDatabase[urlID]) {
    return res.status(404).send('URL not found!\n');
  }

  if (!userID) {
    return res.status(403).send(`You must be logged in to edit an URL!\n`);
  }

  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[urlID]) {
    return res.status(403).send(`You do not have permission to edit this URL!\n`);
  }

  urlDatabase[urlID]["longURL"] = newURL;
  return res.redirect("/urls");
});

//// REGISTER ////
app.get("/register", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
  }
  return res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (!userEmail || !userPassword) {
    return res.status(400).send("Registration Failed: email and password cannot be blank!");
  }

  const user = findUserByEmail(userEmail, users);
  if (user) {
    return res.status(400).send("Registration Failed: a user with that email already exists!");
  }

  const hashedPassword = bcrypt.hashSync(userPassword);
  // console.log(hashedPassword);

  users[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };

  // res.cookie("user_id", userID);
  req.session.user_id = userID;
  return res.redirect("/urls");
});

//// LOGIN ////
app.get("/login", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  return res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const user = findUserByEmail(userEmail, users);

  const { error, data } = authenticateUser(user, userPassword);
  if (error) {
    return res.status(403).send(`<html>Login Failed: ${error}</html>`);
  }

  req.session.user_id = user.id;
  return res.redirect('/urls');
});

//// LOGOUT (clear cookie) ////
app.post("/logout", (req, res) => {
  // res.clearCookie('user_id');
  req.session = null;
  return res.redirect('/urls');
});

app.get("*", (req, res) => {
  res.statusCode = 404;
  return res.send(`${res.statusCode} Page Not Found :(`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});