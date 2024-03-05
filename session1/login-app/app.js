import express from 'express';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';

import axios from 'axios';

import session from 'express-session';
import fileStore from 'session-file-store';
const FileStore = fileStore(session);

const tokenStore = (req) => ({
  key: 'token',
  get() { 
    return req.session?.[key] || null;
  },
  set(value) {
    if (req.session) req.session[key] = value;
  }
});

const app = express();
app.use(express.static('public'));

const isProd = app.get('env') === 'production';
app.set('view engine', 'html');
nunjucks.configure('./templates', {
  autoescape: true,
  express: app,
  watch: true
});

isProd && app.set('trust proxy', 1);
app.use(session({
  secret: 'a',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProd,
  },
  store: new FileStore(),
}));

app.use(express.urlencoded({ extended: false }));

app.use((err, _req, res, _next) => {
  console.log(err);
  res.status(404).render('404');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  axios.post('https://vppapidev.haezoom.com/api/token-auth/', {
    username, password,
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(({data}) => {
      const { token } = data;
      req.session[token] = token;

      res.json({
        result: 'success',
      });
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(401);
    });
  
});

app.get('/*', (req, res, next) => {  
  try {
    if (
      req.path === '/' 
      || req.path.startsWith('/widgets') 
      || req.path.startsWith('/pages')
    ) {
      const target = req.path.replace(/^\//, '') || 'index';
      res.render(target, {
        uuid() {
          return `id_${uuidv4()}`;
        },
        ...req.query
      });
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.log(err);
    next(error);
  }
});

app.listen(4000, () => {

}); 