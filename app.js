'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const session = require('express-session');

const passport = require('passport');
console.log('-- passport --')
const routes = require('./routes');
console.log('[-- passport --]')

// Express configuration
const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.json({extended: false}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(errorHandler());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./auth');

app.get('/', routes.site.index);
app.get('/login', routes.site.loginForm);
app.post('/login', routes.site.login);
app.get('/logout', routes.site.logout);
app.get('/account', routes.site.account);

app.get('/dialog/authorize', routes.oauth2.authorization);
app.post('/dialog/authorize/decision', routes.oauth2.decision);
app.post('/oauth/token', routes.oauth2.token);
const request = require('request'); // npm install request
app.get('/test', (req, res) => {
  console.log(req.body)
  console.log(req.query)
  request.post({
      url: 'http://localhost:3000/oauth/token',
      form: req.body,
      header: req.headers
    },
    function (err, httpResponse, body) {
      // console.log(httpResponse)
      console.log(body)
    })
})

app.get('/api/userinfo', routes.user.info);
app.get('/api/clientinfo', routes.client.info);

app.listen(process.env.PORT || 3000);
