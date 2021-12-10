const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, accessCheck } = require('./helpers.js');
const methodOverride = require('method-override');
const requestIp = require('request-ip');
const PORT = 8080; // default port 8080

const app = express();
app.set('view engine', 'ejs');

/** DATA */
const users = {
  aJ48lW: {
    user_id: 'aJ48lW',
    email: 'donthephan@gmail.com',
    hashedPassword: /* 'asdf' */ `$2a$10$Qmb6FZ70vI2Cq./YRcKZgOI2zfaV7eKi5ZKbuMC.tzg7jUGfJv4la`
  }
};
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    user_id: 'aJ48lW',
    visited: 0,
    visitors: [],
    visitorLog: [],
    created: new Date()
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    user_id: 'aJ48lW',
    visited: 0,
    visitors: [],
    visitorLog: [],
    created: new Date()
  }
};

/** MIDDLEWARE */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: [ 'superUltraSpecialSecretKey' ],
    user_id: undefined,

    // cookie options
    maxAge: 60 * 60 * 1000 // expires after 1 hour
  })
);
app.use(methodOverride('_method'));
app.use(requestIp.mw());

/** ROUTES */

// View databases
// app.get('/database', (req, res) => {
//   res.json({ users, urlDatabase });
// });

app.get('/', (req, res) => {
  let user_id = req.session.user_id;
  if (user_id && users[user_id]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let urlData = urlDatabase[shortURL];

  if (urlData) {
    //* happy path
    urlData.visited++;

    const ip = req.clientIp;
    if (!urlData.visitors.includes(ip)) {
      urlData.visitors.push(ip);
    }

    urlData.visitorLog.push({ date: new Date(), id: ip });

    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    res.status(400).send('400 - requested link does not exist');
  }
});

app.get('/urls', (req, res) => {
  let user_id = req.session.user_id;

  let filteredUrlDatabase = Object.fromEntries(
    Object.entries(urlDatabase).filter(([ key, value ]) => value.user_id === user_id)
  );

  const templateVars = { urls: filteredUrlDatabase, user: users[user_id] };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  let user_id = req.session.user_id;
  let user = users[user_id];

  if (user) {
    //* happy path
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;

    urlDatabase[shortURL] = {
      longURL,
      user_id,
      visited: 0,
      visitors: [],
      visitorLog: [],
      created: new Date()
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('Request Denied. Please log in');
  }
});

app.get('/urls/new', (req, res) => {
  let user_id = req.session.user_id;
  if (user_id) {
    const templateVars = { user: users[user_id] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let urlData = urlDatabase[req.params.shortURL];
  let user_id = req.session.user_id;

  let { invalidAccess, accessDenialHandler } = accessCheck(urlData, user_id);

  if (invalidAccess) {
    accessDenialHandler(res, urlData, user_id);
  } else {
    //* happy path
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlData.longURL,
      created: urlData.created,
      user: users[user_id],
      visitorLog: urlDatabase[req.params.shortURL].visitorLog
    };
    res.render('urls_show', templateVars);
  }
});

app.put('/urls/:shortURL', (req, res) => {
  let newLongURL = req.body.newLongURL;

  let urlData = urlDatabase[req.params.shortURL];
  let user_id = req.session.user_id;

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

app.delete('/urls/:shortURL', (req, res) => {
  let urlData = urlDatabase[req.params.shortURL];
  let user_id = req.session.user_id;

  let { invalidAccess, accessDenialHandler } = accessCheck(urlData, user_id);

  if (invalidAccess) {
    accessDenialHandler(res, urlData, user_id);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    const templateVars = { user: users[user_id] };
    res.render('login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  let { email, password } = req.body;

  let user = getUserByEmail(email, users);

  if (!email || !password) {
    res.status(400).send('400 - missing email or password');
  } else {
    if (user) {
      //* happy path
      if (bcrypt.compareSync(password, user.hashedPassword)) {
        req.session.user_id = user.user_id;
        res.redirect('/urls');
      } else {
        res.status(400).send('400 - password does not match');
      }
    } else {
      res.status(400).send('400 - user does not exist');
    }
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    const templateVars = { user: users[user_id] };
    res.render('register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);

  // 1. no email or password
  if (!email || !password) {
    res.status(400).send('400 - missing email or password');
  } else if (getUserByEmail(email, users)) {
    // 2. email already exists
    res.status(400).send('400 - email already exists');
  } else {
    //* else happy path
    let user_id = generateRandomString();

    users[user_id] = { user_id, email, hashedPassword };

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
