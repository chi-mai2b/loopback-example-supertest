'use strict';

var fileIO = require('./file-io')
  , loopback = require('loopback')
  , boot = require('loopback-boot')
  , path = require('path');


function TestUtils(options) {
  this.config = options;
}

TestUtils.prototype.start = start;
TestUtils.prototype.stop = stop;
TestUtils.prototype.clear = clear;

module.exports = TestUtils;


function start(done) {
  return new Promise(function (resolve, reject) {
    prepareTestMemoryDataSource(this.config)
      .then(function (ds) {

        var app = this.config.app;

        boot(app, {
          appRootDir: path.join(process.cwd(), 'server'),
          dataSources: ds
        });

        app.use(loopback.rest());

        this.currentServer = app.listen(done);
        this.dataSource = ds;
      }.bind(this))
      .catch(reject);

  }.bind(this));
}

function stop() {
  if (this.currentServer !== undefined) {
    console.info('\tStopping server');
    this.currentServer.close();
    delete this.currentServer;
  }
}

function clear() {
  if (this.dataSource !== undefined) {
    console.info('\tCleared data source');
    fileIO.remove(this.dataSource.db.file);
    delete this.dataSource;
  }
}

function prepareTestMemoryDataSource(options) {
  return new Promise(function (resolve, reject) {
    var tmpDir = options.tmpDir || './tmp'
      , filePath = path.join(tmpDir, options.name + '.json')
      ;

    fileIO.write(filePath, options.data)
      .then(function () {
        console.info('\tcreated test memory ds file', filePath);
        resolve({
          db: {
            name: 'db',
            connector: 'memory',
            file: filePath
          }
        });
      })
      .catch(reject);
  });
}
