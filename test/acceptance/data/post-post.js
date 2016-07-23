'use strict';

var
  accessTokenMap = {}
  , membersMap = {}
  , user = require('../../mock-factories/user').build(1)
  , at = require('../../mock-factories/access-token').build()
  ;

membersMap[user.id] = user;
accessTokenMap[at.id] = at;
accessTokenMap[at.id].userId = user.id;

module.exports = {
  ids: {
    AccessToken: 2,
    ACL: 1,
    RoleMapping: 1,
    Role: 1,
    User: 1,
    Member: 2,
    Forum: 1,
    Post: 1
  },
  models: {
    AccessToken: accessTokenMap,
    ACL: {},
    RoleMapping: {},
    Role: {},
    User: {},
    Member: membersMap,
    Forum: {},
    Post: {}
  }
};
