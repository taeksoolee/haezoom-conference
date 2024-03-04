import express from 'express';
import nunjucks from 'nunjucks';

import { v4 as uuidv4 } from 'uuid';
import validator from 'validator';

const app = express();
app.set('view engine', 'html');
nunjucks.configure('./templates', {
  autoescape: true,
  express: app,
  watch: true
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/*', (req, res, next) => {  
  try {
    const target = req.path.replace(/^\//, '') || 'index';
    res.render(target, {
      uuid() {
        return `id_${uuidv4()}`;
      },
      ...req.query
    });
  } catch (err) {
    console.log(err);
    next(error);
  }
});

app.post('/valid/email', (req, res) => {
  const text = req.body['text'] ?? '';
  if (validator.isEmail(text)) {
    res.redirect(`/entities/empty`);
  } else {
    res.redirect(`/entities/message?type=danger&text=Invalid Email`);
  }
});

app.post('/valid/password', (req, res) => {
  const text = req.body['text'] ?? '';
  // https://github.com/validatorjs/validator.js
  if (validator.isStrongPassword(text)) {
    res.redirect(`/entities/empty`);
  } else {
    res.redirect(`/entities/message?type=danger&text=Invalid Password`);
  }
});

app.post('/login', (req, res) => {

  const valid = true
    && validator.isEmail(req.body['email'])
    && validator.isStrongPassword(req.body['password']);

  if (valid) {
    res.json({
      message: 'success',
    });
  } else {
    res.sendStatus(400);
  }
});

app.use((err, _req, res, _next) => {
  console.log(err);
  res.status(404).render('404');
});

app.listen(4000, () => {

}); 