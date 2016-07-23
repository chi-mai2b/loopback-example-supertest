/*global process, describe, before, after, beforeEach, afterEach, it, expect */
'use strict';
require('events').EventEmitter.defaultMaxListeners = Infinity; // node bug
process.env.NODE_ENV = 'test';


describe('Post REST API', function () {
  var
    expect = require('chai').expect
    , supertest = require('supertest')
    , postFactory = require('../mock-factories/post')
    , TestUtils = require('./utils/TestUtils')
    , dataUtils = require('./utils/data')

    , data
    , test
    , app
    ;


  function request(verb, url) {
    return supertest(app)[verb](url)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/);
  }

  function prepareTest(name, testData, done) {
    app = require('../../server/server');
    data = testData;

    test = new TestUtils({
      name: name,
      app: app,
      data: data
    });

    test.start(done);
  }

  function findTokenFromUserId(userId) {
    return Object.keys(data.models.AccessToken)
      .find(function (accessToken) {
        return data.models.AccessToken[accessToken].userId === userId;
      });
  }

  describe('GET', function () {

    before(function (done) {
      prepareTest('post-GET', require('./data/post-get'), done);
    });

    after(function () {
      test.stop();
    });

    // reject

    it('/posts should reject request for all posts from anonymous users', function (done) {
      request('get', '/posts')
        .expect(401, done);
    });

    it('/posts/{id} should reject request for post with id from anonymous', function (done) {
      var id = 2;

      request('get', '/posts/' + id)
        .expect(401, done);
    });

    it('/posts should reject request for all posts from logged in user', function (done) {
      var loggedInMemberAccessToken = findTokenFromUserId(2);

      request('get', '/posts/?access_token=' + loggedInMemberAccessToken)
        .expect(401, done);
    });

    // accept

    it('/posts/{id} should accept request from logged in user and return the post with matching id', function (done) {
      var id = 2
        , loggedInMemberAccessToken = findTokenFromUserId(2);

      request('get', '/posts/' + id + '?access_token=' + loggedInMemberAccessToken)
        .expect(200)
        .expect(data.models.Post[id], done);
    });

    it('/posts should accept request for all posts from admin', function (done) {
      var adminAccessToken = findTokenFromUserId(1);

      request('get', '/posts/?access_token=' + adminAccessToken)
        .expect(200)
        .expect(dataUtils.toArray(data.models.Post), done);
    });

  });

  describe('POST', function () {
    var lastId = 1
      , postUrl
      , newPost
      , loggedInMember;

    before(function (done) {
      prepareTest('post-POST', require('./data/post-post'), done)
    });

    after(function () {
      test.stop();
    });

    beforeEach(function () {
      newPost = buildPost();
      loggedInMember = data.models.Member[1];
      postUrl = '/posts?access_token=' + findTokenFromUserId(loggedInMember.id);
    });

    function buildPost() {
      var newPost = postFactory.build(lastId++);
      // the factory provides default for the models, delete as read only
      delete newPost.id;
      delete newPost.created;

      return newPost;
    }

    describe('Authorization', function () {

      it('/posts should reject request from anonymous users', function (done) {
        request('post', '/posts')
          .send(newPost)
          .expect(401, done);
      });

      // accept

      it('/posts should accept request from logged in users', function (done) {
        request('post', postUrl)
          .send(newPost)
          .expect(function (res) {
            expect(res.body.id).to.equal(1);  // first post accepted
            expect(res.body.header).to.equal(newPost.header);
            expect(res.body.message).to.equal(newPost.message);
            expect(res.body.lastEdited).not.to.be.defined;
          })
          .expect(200, done);
      });

    });

    describe('Data validation', function () {

      function testRejectedInvalid(url, data, messageRegex, done) {
        return request('post', url)
          .send(data)
          .expect(function (res) {
            expect(res.body.error.message).to.match(messageRegex);
          })
          .expect(422, done);
      }

      // reject

      it('/posts should reject request when post has a missing header', function (done) {
        delete newPost.header;

        testRejectedInvalid(postUrl, newPost, /`header` can't be blank/, done);
      });

      it('/posts should reject request when post has an empty header', function (done) {
        newPost.header = '';

        testRejectedInvalid(postUrl, newPost, /`header` can't be blank/, done);
      });

      it('/posts should reject request when post has a header over 50 chars', function (done) {
        newPost.header = new Array(51).fill('a').join('');

        testRejectedInvalid(postUrl, newPost, /header is too long/, done);
      });

      it('/posts should reject request when post has a missing message', function (done) {
        delete newPost.message;

        testRejectedInvalid(postUrl, newPost, /`message` can't be blank/, done);
      });

      it('/posts should reject request when post has an empty message', function (done) {
        newPost.message = '';

        testRejectedInvalid(postUrl, newPost, /`message` can't be blank/, done);
      });

      it('/posts should reject request when post has a message over 5000 chars', function (done) {
        newPost.message = new Array(5001).fill('a').join('');

        testRejectedInvalid(postUrl, newPost, /message is too long/, done);
      });

      it('/posts/ should reject request when post has updated read-only author', function (done) {
        newPost.authorId = new Date(2000, 1, 2, 3);

        testRejectedInvalid(postUrl, newPost, /Read only property changed: authorId/, done);
      });

      it('/posts/ should reject request when post has updated read-only created date', function (done) {
        newPost.created = new Date(2000, 1, 2, 3);

        testRejectedInvalid(postUrl, newPost, /Read only property changed: created/, done);
      });

      it('/posts/ should reject request when post has updated read-only lastEdited date', function (done) {
        newPost.lastEdited = new Date(2000, 1, 2, 3);

        testRejectedInvalid(postUrl, newPost, /Read only property changed: lastEdited/, done);
      });

      // accept

      it('/posts should set the created date to current time', function (done) {
        var preRequestTs = Date.now();

        request('post', postUrl)
          .send(newPost)
          .expect(function (res) {
            var postRequestTs = Date.now(),
              createdTs = new Date(res.body.created).getTime();

            expect(createdTs).to.be.above(preRequestTs);
            expect(createdTs).to.be.below(postRequestTs);
          })
          .expect(200, done);
      });

      it('/posts should set the authorId based on the access token', function (done) {
        request('post', postUrl)
          .send(newPost)
          .expect(function (res) {
            expect(res.body.authorId).to.equal(loggedInMember.id);
          })
          .expect(200, done);
      });

      it('/posts should accept request when post has a header of 50 chars', function (done) {
        newPost.header = new Array(50).fill('a').join('');

        request('post', postUrl)
          .send(newPost)
          .expect(200, done);
      });

      it('/posts should accept request when post has a message of 5000 chars', function (done) {
        newPost.message = new Array(5000).fill('a').join('');

        request('post', postUrl)
          .send(newPost)
          .expect(200, done);
      });

    });

  });

  describe('PUT', function () {
    var
      originalPost
      , lastEditedId = 0
      , editedPost
      , editedPostUrl
      , authorAccessToken;

    before(function (done) {
      prepareTest('post-PUT', require('./data/post-put'), done)
    });

    after(function () {
      test.stop();
    });

    beforeEach(function () {
      var editedPostId = Object.keys(data.models.Post)[lastEditedId++];

      if (editedPostId === undefined) {
        throw Error('Not enough generated posts');
      }

      originalPost = data.models.Post[editedPostId];

      editedPost = dataUtils.clone(originalPost);
      authorAccessToken = findTokenFromUserId(2);
      editedPostUrl = '/posts/' + editedPost.id + '?access_token=' + authorAccessToken;
    });

    describe('Authorization', function () {

      // reject

      it('/posts/{id} should reject the request from anonymous users', function (done) {
        editedPost.header += 'updated';

        request('put', '/posts/' + editedPost.id)
          .send(editedPost)
          .expect(401, done);
      });

      it('/posts/{id} should reject the request from logged in users', function (done) {
        var loggedInMemberAccessToken = findTokenFromUserId(3);
        editedPost.header += 'updated';

        request('put', '/posts/' + editedPost.id + '?access_token=' + loggedInMemberAccessToken)
          .send(editedPost)
          .expect(401, done);
      });

      // accept

      it('/posts/{id} should accept the request from author', function (done) {
        editedPost.header += 'updated';

        request('put', editedPostUrl)
          .send(editedPost)
          .expect(200, done);
      });

      it('/posts/{id} should accept request from admin', function (done) {
        var adminAccessToken = findTokenFromUserId(1);
        editedPost.header += 'updated';

        request('put', '/posts/' + editedPost.id + '?access_token=' + adminAccessToken)
          .send(editedPost)
          .expect(200, done);
      });

    });

    describe('Data validation', function () {

      function testNotUpdated(url, updatedContent, originalContent, done) {
        return request('put', url)
          .send(updatedContent)
          .expect(422)
          .end(function () {
            request('get', url)
              .expect(200)
              .expect(originalContent, done);
          });
      }

      // reject

      it('/posts/{id} should reject request when post has an empty header', function (done) {
        editedPost.header = '';

        testNotUpdated(editedPostUrl, editedPost, originalPost, done);
      });

      it('/posts/{id} should reject request when post has a header over 50 chars', function (done) {
        editedPost.header = new Array(51).fill('a').join('');

        testNotUpdated(editedPostUrl, editedPost, originalPost, done);
      });

      it('/posts/{id} should reject request when post has an empty message', function (done) {
        editedPost.message = '';

        testNotUpdated(editedPostUrl, editedPost, originalPost, done);
      });

      it('/posts/{id} should reject request when post has a message over 5000 chars', function (done) {
        editedPost.message = new Array(5001).fill('a').join('');

        testNotUpdated(editedPostUrl, editedPost, originalPost, done);
      });

      it('/posts/{id} should reject request when post has updated read-only author', function (done) {
        editedPost.authorId = 12345;

        testNotUpdated(editedPostUrl, editedPost, originalPost, done)
          .expect(function (res) {
            expect(res.body.error).to.equal('Read only property changed: authorId');
          });
      });

      it('/posts/{id} should reject request when post has updated read-only created date', function (done) {
        editedPost.created = new Date();

        testNotUpdated(editedPostUrl, editedPost, originalPost, done)
          .expect(function (res) {
            expect(res.body.error).to.equal('Read only property changed: created');
          });
      });

      it('/posts/{id} should reject request when post has updated read-only lastEdited date', function (done) {
        editedPost.lastEdited = new Date(2000, 1, 2, 3, 4, 5);

        testNotUpdated(editedPostUrl, editedPost, originalPost, done)
          .expect(function (res) {
            expect(res.body.error).to.equal('Read only property changed: lastEdited');
          });
      });

      // accept

      it('/posts/{id} should set the lastEdited to current time', function (done) {
        var preRequestTs = Date.now();

        editedPost.header += ' updated';

        request('put', editedPostUrl)
          .send(editedPost)
          .expect(function (res) {
            var postRequestTs = Date.now(),
              editedTs = new Date(res.body.lastEdited).getTime();

            expect(editedTs).to.be.above(preRequestTs);
            expect(editedTs).to.be.below(postRequestTs);
          })
          .expect(200, done);
      });

      it('/posts/{id} should accept request when post has a updated header of 50 chars', function (done) {
        editedPost.header = new Array(50).fill('a').join('');

        request('put', editedPostUrl)
          .send(editedPost)
          .expect(200, done);
      });

      it('/posts/{id} should accept request when post has a updated message of 5000 chars', function (done) {
        editedPost.message = new Array(5000).fill('a').join('');

        request('put', editedPostUrl)
          .send(editedPost)
          .expect(200, done);
      });

    });

  });

  describe('DELETE', function () {
    var
      lastDeletedId = 0
      , deletedPost;

    before(function (done) {
      prepareTest('post-DELETE', require('./data/post-delete'), done)
    });

    after(function () {
      test.stop();
    });

    beforeEach(function () {
      var deletedPostId = Object.keys(data.models.Post)[lastDeletedId++];

      if (deletedPostId === undefined) {
        throw Error('Not enough generated posts');
      }

      deletedPost = data.models.Post[deletedPostId];
    });

    describe('Authorization', function () {

      // reject

      it('/posts/{id} should reject the request from anonymous users', function (done) {
        request('delete', '/posts/' + deletedPost.id)
          .expect(401, done);
      });

      it('/posts/{id} should reject the request from logged in users', function (done) {
        var loggedInMemberAccessToken = findTokenFromUserId(3);

        request('delete', '/posts/' + deletedPost.id + '?access_token=' + loggedInMemberAccessToken)
          .expect(401, done);
      });

      // accept

      it('/posts/{id} should accept the request from author', function (done) {
        var authorAccessToken = findTokenFromUserId(2);

        request('delete', '/posts/' + deletedPost.id + '?access_token=' + authorAccessToken)
          .expect(200, done);
      });

      it('/posts/{id} should accept request from admin', function (done) {
        var adminAccessToken = findTokenFromUserId(1);

        request('delete', '/posts/' + deletedPost.id + '?access_token=' + adminAccessToken)
          .expect(200, done);
      });

    });

  });

});
