'use strict';

function getRandomHash(hashLength) {
  var alpha = 'abcdefghijklmnopqrstuvwxyz'
    , alphaNumStr = [alpha, alpha.toLocaleUpperCase(), '0123456789'].join('')
    , hash = [];

  for (var i = 0, alphaNumLen = alphaNumStr.length; i < hashLength; i++) {
    var rand = Math.round(Math.random() * 1000) % alphaNumLen;
    hash[i] = alphaNumStr.charAt(rand);
  }

  return hash.join('');
}

function buildToken() {
  return {
    id: getRandomHash(64),
    ttl: 60 * 60,
    created: new Date()
  };
}

function init(count) {
  var tokens = [];

  for (var i = 0; i < count; i++) {
    tokens[i] = buildToken();
  }

  return tokens;
}

module.exports = {
  get: init,
  build: buildToken
};
