'use strict';

function buildPost(id) {
  var post = 'Post ' + id;

  return {
    id: id,
    header: post + ' header',
    message: post + ' body',
    created: new Date(2000 + id, 0, 1, 2, 3, 4).toJSON()
  };
}

function init(count) {
  var posts = [];

  for (var i = 0; i < count; i++) {
    posts[i] = buildPost(i + 1);    // model ids starting at 1
  }

  return posts;
}

module.exports = {
  get: init,
  build: buildPost
};
