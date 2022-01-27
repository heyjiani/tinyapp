const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//// implement middleware ////
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

//// DATABASE ////
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "abCd12": {
    id: "abCd12", 
    email: "trixie@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "haha67": {
    id: "haha67", 
    email: "katya@example.com", 
    password: "dishwasher-funk"
  }
};

/* HELPER FUNCTIONS */
//// generate random id ////
function generateRandomString() {
  return Math.random().toString(36).substring(3, 9);
}

//// find user in database ////
const findUserByEmail = (email) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) return user;
  }
  return false;
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

app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID]
  };
  res.render("urls_new", templateVars);
});

//// CREATE NEW SHORT URL ////
app.post("/urls", (req, res) => {
  // console.log(req.body);
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars)
});

//// DELETE URL ////
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//// EDIT URL ////
app.post("/urls/:id", (req, res) => {
  const urlID = req.params.id;
  // console.log('ID is:', urlID);
  const newURL = req.body.newURL;
  urlDatabase[urlID] = newURL;
  res.redirect("/urls");
});

//// REGISTER ////
app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
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
    res.status(400).send("Registration Failed: email and password cannot be blank!");
  }

  const user = findUserByEmail(userEmail);
  if (user) {
    res.status(400).send("Registration Failed: a user with that email already exists!");
  }

  users[userID] = {
    id: userID,
    email: userEmail,
    password: userPassword
  };
  // console.log(`user details:`, users);
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

//// LOGIN ////
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    user: users[userID]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const user = findUserByEmail(userEmail);
  // console.log('user: ', user);

  if (!user) {
    res.status(403).send("Login failed: Make sure you entered the right email/password and try again.");
  }

  if (user.password !== userPassword) {
    res.status(403).send("Login failed: Make sure you entered the right email/password and try again.");
  }

  res.cookie("user_id", user.id);
  res.redirect('/urls');
});

//// LOGOUT (clear cookie) ////
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("*", (req, res) => {
  res.statusCode = 404;
  res.send(`${res.statusCode} Page Not Found :(`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});