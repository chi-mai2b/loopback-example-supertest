'use strict';

var
  postMap = {}
  , postCount = 20

  , membersCount
  , memberMap = {}

  , accessTokenMap = {}
  , accessTokenCount = membersCount = 3
  ;

function publishModelMap(factory, modelMap) {
  factory
    .forEach(function (model) {
      modelMap[model.id] = model;
    });
}

publishModelMap(require('../../mock-factories/user').get(membersCount), memberMap);
publishModelMap(require('../../mock-factories/post').get(postCount), postMap);

// user 1 admin
// user 2 author
// user 3 logged in
Object.keys(postMap).forEach(function (id) {
  postMap[id].authorId = memberMap[2].id;
});

require('../../mock-factories/access-token')
  .get(accessTokenCount)
  .forEach(function (token, index) {
    accessTokenMap[token.id] = token;
    token.userId = memberMap[index + 1].id;
  });


module.exports = {
  ids: {
    AccessToken: accessTokenCount + 1,
    ACL: 1,
    User: 1,
    RoleMapping: 2,
    Role: 2,
    Member: membersCount + 1,
    Forum: 1,
    Post: postCount + 1
  },
  models: {
    User: {},
    AccessToken: accessTokenMap,
    ACL: {},
    RoleMapping: {
      1: {
        id: 1,
        principalId: 1,
        principalType: 'USER',
        roleId: 1
      }
    },
    Role: {
      1: {
        id: 1,
        name: 'admin',
        created: new Date()
      }
    },
    Forum: {},
    Member: memberMap,
    Post: postMap
  }
};
