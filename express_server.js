const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {};

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
  let user_id = req.cookies.user_id;
  const templateVars = { urls: urlDatabase, user: users[user_id] };
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
  let user_id = req.cookies.user_id;
  const templateVars = { user: users[user_id] };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  let user_id = req.cookies.user_id;

  const templateVars = { shortURL, longURL, user: users[user_id] };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
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
  let email = req.body.email;

  for (let value of Object.values(users)) {
    if (value.email === email) {
      res.cookie('user_id', value.id);
    }
  }

  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let user_id = req.cookies.user_id;
  const templateVars = { user: users[user_id] };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  /** handle errors: */
  // 1. no email or password
  if (!email || !password) {
    res.statusCode = 400;
    res.send('400 - missing email or password');
  } else if (emailExists(email)) {
    // 2. email exists
    res.statusCode = 400;
    res.send('400 - email already exists');
  } else {
    /** else continue */
    let id = generateRandomString();

    users[id] = { id, email, password };
    console.log(users);

    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  // let randomString = '';
  // for (let i = 0; i < 6; i++) {
  //   let asciiCode = Math.floor(Math.random() * 26) + 97;
  //   randomString += String.fromCharCode(asciiCode);
  // }
  // return randomString;
  return Math.random().toString(36).substring(2, 8);
}

function emailExists(email) {
  for (let user of Object.values(users)) {
    if (user.email === email) return true;
  }
  return false;
}
