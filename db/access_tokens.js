'use strict';

const tokens = {
  a: {userId: 1, clientId: 'abc123'}
};

module.exports.find = (key, done) => {
  if (tokens[key]) return done(null, tokens[key]);
  return done(new Error('Token Not Found'));
};

module.exports.findByUserIdAndClientId = (userId, clientId, done) => {
  console.log('start findByUserIdAndClientId')
  console.log(tokens)
  console.log(userId)
  console.log(clientId)

  for (let token of Object.keys(tokens)) {
    console.log('tokens[token].userId : ', tokens[token].userId)
    console.log('userId : ', userId)
    console.log('tokens[token].clientId : ', tokens[token].clientId)
    console.log('clientId : ', clientId)
    if (tokens[token].userId == userId && tokens[token].clientId == clientId) {
      console.log('success!')
      return done(null, token);
    }
  }
  console.error('failed...')
  return done(new Error('Token Not Found'));
};

module.exports.save = (token, userId, clientId, done) => {
  tokens[token] = { userId, clientId };
  done();
};
