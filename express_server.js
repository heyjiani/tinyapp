const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

//// implement middleware ////
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

//// generate random short url id ////
function generateRandomString() {
  return Math.random().toString(36).substring(3, 9);
}

//// DATABASE ////
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
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
  const templateVars = {
    username: req.cookies["username"],
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
  const templateVars = {
    username: req.cookies["username"],
  }
  res.render("registration", templateVars);
});

//// LOGIN (set cookie) ////
app.post("/login", (req, res) => {
  // console.log(req.body.username);
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

//// LOGOUT (clear cookie) ////
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get("*", (req, res) => {
  res.statusCode = 404;
  res.send(`${res.statusCode} Page Not Found :(`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});