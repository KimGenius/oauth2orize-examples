'use strict';

console.log('-- site')
const site = require('./site');
console.log('-- oauth2')
const oauth2 = require('./oauth2');
console.log('-- user')
const user = require('./user');
console.log('-- client')
const client = require('./client');

module.exports = {
  site,
  oauth2,
  user,
  client,
};
