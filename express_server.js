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
    res.send(`<html>You must <a href="http://localhost:8080/login">log in</a> to see this page!</html>`)
  } else {
    const userURLs = urlsForUser(userID, urlDatabase);
    const templateVars = {
      user: users[userID],
      urls: userURLs
    };
    res.render("urls_index", templateVars);
  }
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
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  if (!userID) {
    res.status("403").send("Access Denied: Please log in first!\n");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID
  };
  // console.log(`URL Database:`, urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status("404").send("OOPS! Looks like the link does not exist.");
  } else {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  }
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
  res.render("urls_show", templateVars)
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

  const userURLs = urlsForUser(userID);
  if (!userURLs[shortURL]) {
    return res.status(403).send(`You do not have permission to edit this URL!\n`);
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
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
  res.redirect("/urls");
});

//// REGISTER ////
app.get("/register", (req, res) => {
  // const userID = req.cookies["user_id"];
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
  }
  res.render("registration", templateVars);
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
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const user = findUserByEmail(userEmail, users);

  if (!user) {
    return res.status(403).send("Login failed: Make sure you entered the right email and try again.");
  }

  if (!bcrypt.compareSync(userPassword, user.password)) {
    return res.status(403).send("Login failed: Make sure you entered the right password and try again.");
  }

  // res.cookie("user_id", user.id);
  req.session.user_id = user.id;
  return res.redirect('/urls');
});

//// LOGOUT (clear cookie) ////
app.post("/logout", (req, res) => {
  // res.clearCookie('user_id');
  req.session = null;
  res.redirect('/urls');
});

app.get("*", (req, res) => {
  res.statusCode = 404;
  res.send(`${res.statusCode} Page Not Found :(`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});