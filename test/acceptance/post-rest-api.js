/*global process, describe, before, after, beforeEach, afterEach, it, expect */
'use strict';

require('events').EventEmitter.defaultMaxListeners = Infinity; // node bug
process.env.NODE_ENV = 'test';

var supertest = require('supertest');

describe('Post REST API', function () {
  var baseUrl = '/api/posts'
    , app
    ;

  function request(verb, url) {
    return supertest(app)[verb](url)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/);
  }

  before(function () {
    app = require('../../server/server')
  });

  after(function () {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
  });


  describe('GET', function () {

    it(baseUrl + ' should get all posts', function (done) {
      request('get', '/api/posts')
        .end(function (req, res) {
          console.log(arguments);
          console.log(res.body);
          done();
        });
    });

  });

});
