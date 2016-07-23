'use strict';

function buildUser(id) {
  var username = 'user_' + id;

  return {
    id: id,
    username: username,
    email: username + '@foo.com',
    password: 'foo123'
  };
}

function init(count) {
  var users = [];

  for (var i = 0; i < count; i++) {
    users[i] = buildUser(i + 1);
  }

  return users;
}

module.exports = {
  get: init,
  build: buildUser
};
