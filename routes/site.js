'use strict';

const passport = require('passport');
const login = require('connect-ensure-login');

module.exports.index = (request, response) => response.send('OAuth 2.0 Server');

module.exports.loginForm = (request, response) => response.render('login');

module.exports.login = passport.authenticate('local', {
  // 성공 시 successReturnToOrRedirect
  // 실패 시 다시 /login으로
  successReturnToOrRedirect: '/account', failureRedirect: '/login'
});

module.exports.logout = (request, response) => {
  request.logout();
  response.redirect('/');
};
console.log(' -- connect ensure login --')

module.exports.account = [
  login.ensureLoggedIn(),
  (request, response) => {
    // console.log(request)
    response.render('account', { user: request.user })
  },
];
console.log('[ -- connect ensure login -- ]')

