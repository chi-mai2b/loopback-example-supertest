'use strict';

var loopback = require('loopback');

module.exports = function (Post) {

  var readOnlyProperties = [
    'authorId',
    'created',
    'lastEdited'
  ];

  // required fields defined in common/models/post.json
  Post.validatesLengthOf('header', {max: 50, message: {max: 'The header is too long'}});
  Post.validatesLengthOf('message', {max: 5000, message: {max: 'The message is too long'}});

  function buildReadOnlyError(key) {
    var err = new Error('Read only property changed: ' + key);
    err.statusCode = 422;
    return err;
  }

  function validateReadOnlyPropertiesNotChanged(ctx, next) {
    var data = ctx.data
      , instance = ctx.instance ? ctx.instance.toObject() : undefined
      , currentInstance = ctx.currentInstance ? ctx.currentInstance.toObject() : undefined
      ;

    if (instance !== undefined) {
      var overriddenProperty = readOnlyProperties.find(function (key) {
        return instance[key] !== undefined;
      });

      if (overriddenProperty !== undefined) {
        return next(buildReadOnlyError(overriddenProperty));
      }

      return next();
    }

    var readyOnlyError = readOnlyProperties.some(function (key) {
      var originalValue = currentInstance[key];

      // the date is sent as string, the original date is an instance of Date
      if (originalValue !== undefined && originalValue.toJSON !== undefined) {
        originalValue = originalValue.toJSON();
      }

      if (originalValue !== data[key]) {
        // stop the check here and send the error
        next(buildReadOnlyError(key));
        return true;
      }
    });

    if (!readyOnlyError) {
      next();
    }
  }

  // before create / update
  Post.observe('before save', function updateTimestamp(context, next) {
    validateReadOnlyPropertiesNotChanged(context, function (err) {
      if (err) {
        return next(err);
      }

      if (context.isNewInstance) {
        var currentContext = loopback.getCurrentContext();

        // set the date here instead of using the "now" default attribute to ensure it was not overridden by the client
        context.instance.created = new Date();
        context.instance.authorId = currentContext.active.accessToken.userId;
      }
      else {
        context.data.lastEdited = new Date();
      }

      next();
    });
  });

};
