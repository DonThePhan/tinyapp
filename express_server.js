const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');

// const urlDatabase = {
//   b2xVn2: 'http://www.lighthouselabs.ca',
//   '9sm5xK': 'http://www.google.com'
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW'
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW'
  }
};

const users = {};

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.send('Invalid short URL');
  }
});

app.get('/urls', (req, res) => {
  let user_id = req.cookies.user_id;
  const templateVars = { urls: urlDatabase, user: users[user_id] };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let userID = req.cookies.user_id;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  let user_id = req.cookies.user_id;
  if (user_id) {
    const templateVars = { user: users[user_id] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  let user_id = req.cookies.user_id;

  const templateVars = { shortURL, longURL, user: users[user_id] };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let newLongURL = req.body.newLongURL;
  if (newLongURL) {
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect('/urls');
  } else {
    res.send('No URL entered');
  }
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

app.get('/login', (req, res) => {
  let user_id = req.cookies.user_id;
  const templateVars = { user: users[user_id] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  let { email, password } = req.body;

  let user = searchUser(email);

  if (!email || !password) {
    res.statusCode = 400;
    res.send('400 - missing email or password');
  } else {
    if (user) {
      //* happy path
      if (user.password === password) {
        res.cookie('user_id', user.id);
        res.redirect('/urls');
      } else {
        res.statusCode = 400;
        res.send('password does not match');
      }
    } else {
      res.statusCode = 400;
      res.send('user does not exist');
    }
  }
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
  } else if (searchUser(email)) {
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
  return Math.random().toString(36).substring(2, 8);
}

function searchUser(email) {
  for (let user of Object.values(users)) {
    if (user.email === email) return user;
  }
}
