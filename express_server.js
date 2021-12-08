const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  let urlShort = generateRandomString();
  let urlLong = req.body.longURL;
  urlDatabase[urlShort] = urlLong;
  res.redirect(`/urls/${urlShort}`);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { username: req.cookies.username };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  const templateVars = { shortURL, longURL, username: req.cookies.username };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  console.log(req.body);
  console.log(req.body.newLongURL);
  let newLongURL = req.body.newLongURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.post('/login', (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    let asciiCode = Math.floor(Math.random() * 26) + 97;
    randomString += String.fromCharCode(asciiCode);
  }
  return randomString;
}
