'use strict';

const users = [
  { id: '1', username: 'bob', password: 'secret', name: 'Bob Smith' },
  { id: '2', username: 'joe', password: 'password', name: 'Joe Davis' },
];

module.exports.findByUserId = (id, done) => {
  console.log(id)
  for (let i = 0, len = users.length; i < len; i++) {
    console.log(users[i].id, id)
    if (users[i].id == id) return done(null, users[i]);
  }
  return done(new Error('User Not Found'));
};

module.exports.findByUsername = (username, done) => {
  for (let i = 0, len = users.length; i < len; i++) {
    if (users[i].username === username) return done(null, users[i]);
  }
  return done(new Error('User Not Found'));
};
