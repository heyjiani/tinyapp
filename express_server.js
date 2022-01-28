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
const authenticateUser = (user) => {
  const { email, password } = user;
  const foundUser = findUserByEmail(email, users);

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

  const foundUser = findUserByEmail(email, users);
  if (foundUser) {
    return { error: "An user with that email already exists!", data: null };
  }

  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password);

  const newUser = {id: userID, email, password: hashedPassword};
  users[userID] = newUser;

  return { error: null, data: newUser };
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
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(401).send(
      `<html>
        <h3>
        You must <a href="http://localhost:8080/login">log in</a> to see this page!
        </h3>
      </html>`
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
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  if (!userID) {
    return res.redirect("/login");
  } 

  return res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
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
  const userID = req.session.user_id;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('URL not found!\n');
  }

  if (!userID) {
    return res.status(403).send(`Yoi did u must be logged in to edit an URL!\n`);
  }

  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) {
    return res.status(403).send(`You do not have permission to edit this URL!\n`);
  }

  delete urlDatabase[shortURL];
  return res.redirect("/urls");
});

//// EDIT URL ////
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
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

  urlDatabase[shortURL]["longURL"] = newURL;
  return res.redirect("/urls");
});

//// REGISTER ////
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
  }
  return res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const { error, data } = addUser(req.body);
  if (error) {
    return res.status(400).send(`<html><h3>Registration Failed: ${error}</h3></html>`);
  }

  req.session.user_id = data.id;
  return res.redirect("/urls");
});

//// LOGIN ////
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  return res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { error, data } = authenticateUser(req.body);
  if (error) {
    return res.status(403).send(`<html>Login Failed: ${error}</html>`);
  }

  req.session.user_id = data.id;
  return res.redirect('/urls');
});

//// LOGOUT (clear cookie) ////
app.post("/logout", (req, res) => {
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