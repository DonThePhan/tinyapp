const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

const app = express();
app.set('view engine', 'ejs');

/** DATA */
const users = {
  aJ48lW: {
    user_id: 'aJ48lW',
    email: 'donthephan@gmail.com',
    password: 'asdf'
  }
};
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    user_id: 'aJ48lW'
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    user_id: 'aJ48lW'
  }
};

/** MIDDLEWARE */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

/** ROUTES */
app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let user_id = req.cookies.user_id;
  let urlData = urlDatabase[shortURL];

  let { invalidAccess, accessDenialHandler } = accessCheck(urlData, user_id);

  if (invalidAccess) {
    accessDenialHandler(res, urlData, user_id);
  } else {
    //* happy path
    res.redirect(urlDatabase[shortURL].longURL);
  }
});

app.get('/urls', (req, res) => {
  let user_id = req.cookies.user_id;

  let filteredUrlDatabase = Object.fromEntries(
    Object.entries(urlDatabase).filter(([ key, value ]) => value.user_id === user_id)
  );
  const templateVars = { urls: filteredUrlDatabase, user: users[user_id] };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  let user_id = req.cookies.user_id;
  let user = users[user_id];

  if (user) {
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;

    urlDatabase[shortURL] = { longURL, user_id };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('Request Denied. Please log in');
  }
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
  let urlData = urlDatabase[req.params.shortURL];
  let user_id = req.cookies.user_id;

  let { invalidAccess, accessDenialHandler } = accessCheck(urlData, user_id);

  if (invalidAccess) {
    accessDenialHandler(res, urlData, user_id);
  } else {
    //* happy path
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlData.longURL,
      user: users[user_id]
    };
    res.render('urls_show', templateVars);
  }
});

app.post('/urls/:shortURL', (req, res) => {
  let newLongURL = req.body.newLongURL;

  let urlData = urlDatabase[req.params.shortURL];
  let user_id = req.cookies.user_id;

  let { invalidAccess, accessDenialHandler } = accessCheck(urlData, user_id);

  if (invalidAccess) {
    accessDenialHandler(res, urlData, user_id);
  } else if (!newLongURL) {
    res.send('No URL entered');
  } else {
    urlDatabase[req.params.shortURL].longURL = newLongURL;
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let urlData = urlDatabase[req.params.shortURL];
  let user_id = req.cookies.user_id;

  let { invalidAccess, accessDenialHandler } = accessCheck(urlData, user_id);

  if (invalidAccess) {
    accessDenialHandler(res, urlData, user_id);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/login', (req, res) => {
  let user_id = req.cookies.user_id;
  const templateVars = { user: users[user_id] };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  let { email, password } = req.body;

  let user = getUserByEmail(email);

  if (!email || !password) {
    res.statusCode = 400;
    res.send('400 - missing email or password');
  } else {
    if (user) {
      //* happy path
      if (user.password === password) {
        res.cookie('user_id', user.user_id);
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

  console.log(email, password);

  /** handle errors: */
  // 1. no email or password
  if (!email || !password) {
    res.statusCode = 400;
    res.send('400 - missing email or password');
  } else if (getUserByEmail(email)) {
    // 2. email exists
    res.statusCode = 400;
    res.send('400 - email already exists');
  } else {
    /** else continue */
    let user_id = generateRandomString();

    users[user_id] = { user_id, email, password };
    console.log(users);

    // redirect w/ POST request & body to login
    res.redirect(307, '/login');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

function getUserByEmail(email) {
  let usersArr = Object.values(users);

  for (let user of usersArr) {
    if (user.email === email) return user;
  }
  return undefined;
}

function accessCheck(urlData, user_id) {
  let invalidAccess = false;
  const accessDenialHandler = function(res, urlData, user_id) {
    if (!urlData) {
      res.send('Invalid short URL');
    } else if (!user_id) {
      res.send('Please login to see your URLs');
    } else if (urlData.user_id !== user_id) {
      res.send('Access restricted. Please log onto the correct account to view this URL');
    }
  };
  if (!urlData || !user_id || urlData.user_id !== user_id) {
    invalidAccess = true;
  }
  return { invalidAccess, accessDenialHandler };
}
