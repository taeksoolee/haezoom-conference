import express from 'express';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';

import axios, { AxiosError } from 'axios';

import session from 'express-session';
import fileStore from 'session-file-store';
const FileStore = fileStore(session);

const tokenStore = (req) => ({
  key: 'token',
  get() { 
    return req.session?.[this.key] || null;
  },
  set(value) {
    if (req.session) req.session[this.key] = value;
  },
  remove() {
    if (req.session) delete req.session[this.key];
  }
});

const getData = (req) => {
  const { page } = req.query;

  return {
    uuid() {
      return `id_${uuidv4()}`;
    },
    token: tokenStore(req).get(),
    ...req.query,
    qs: `?${Object.keys(req.query).map((k) => `${k}=${req.query[k]}`).join('&')}`,
    page: page || 'home',
  }
}

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
      if (token) {
        tokenStore(req).set(token);
        res.render('page.html', getData(req));
      } else {
        throw Error('Unknown');
      }
    })
    .catch(err => {
      if (axios.isAxiosError(err)) {
        /**
       * @type {AxiosError}
       */
        const axiosErr = err;
        console.log(axiosErr.response.status);
        if (axiosErr.response.status >= 400 && axiosErr.response.status < 500) {
          const data = axiosErr.response.data;
          res.status(401).render('widgets/alert', {
            message: Object.keys(data).map(key => data[key]).join(''),
          });
          return;
        }
      }

      res.status(500).render('widgets/alert', {
        message: '알 수 없는 오류가 발생했습니다.',
      });
    });
  
});

app.post('/logout', (req, res) => {
  tokenStore(req).remove();
  res.render('widgets/forms/login-form.html', getData(req));
});

app.get('/widgets/tables/resource-list', async (req, res) => {
  /**
   * @typedef Resource
   * @prop {number} resource_id
   * @prop {string} resource_name
   * @prop {string} resource_address
   * @prop {number} resource_capacity
   * @prop {number} resource_latitude
   * @prop {number} resource_longitude
   * @prop {'True' | 'False'} is_ess
   * @prop {string} resource_shorter_address
   * @prop {string} contract_number
   * @prop {string} cbp_gen_id
   * @prop {string} reg_date
   * @prop {'operation'} status
   */
  const data = await axios.get('https://vppapidev.haezoom.com/api/vpp/resources/', {
    headers: {
      Authorization: `JWT ${tokenStore(req).get()}`,
    }
  })

  /**
   * @type {Resource[]}
   */
  const list = data.data.results;
  res.render('widgets/tables/resource-list', {
    list,
  });
})

app.get('/*', (req, res, next) => {  
  try {
    if (
      req.path === '/' 
      || req.path === '/page'
      || req.path.startsWith('/widgets') 
      || req.path.startsWith('/pages')
    ) {
      const target = req.path.replace(/^\//, '') || 'index';
      res.render(target, getData(req), (err, html) => {
        if (err) {
          console.log(err);
          res.redirect('/notfound');      
        }

        res.send(html);
      });
    } else {
      res.render('404');
      // res.status(404).render('404.html', getData(req));
    }
  } catch (err) {
    console.log(err);
    
  }
});

app.listen(4000, () => {

}); 