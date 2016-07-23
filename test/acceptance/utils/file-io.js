/*global process, Promise */
'use strict';

var
  fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  ;

function write(filePath, data) {
  return new Promise(function (resolve, reject) {
    var dirName = path.dirname(filePath);

    mkdirp(dirName, function (err) {
      if (err) reject(err);
      var fileContent = typeof  data === 'string' ? data : JSON.stringify(data);

      fs.writeFile(filePath, fileContent, function (err) {
        if (err) reject(err);

        resolve();
      });
    });
  });
}

function remove(filePath) {
  fs.unlinkSync(filePath);
}

module.exports = {
  write: write,
  remove: remove
};
