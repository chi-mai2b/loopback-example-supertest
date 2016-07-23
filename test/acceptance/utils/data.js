module.exports = {
  toArray: function (dataMap) {
    return Object.keys(dataMap).map(function (id) {
      return dataMap[id];
    });
  },
  clone: function (data) {
    return JSON.parse(JSON.stringify(data));
  }
};
