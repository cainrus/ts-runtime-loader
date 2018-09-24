const convert = require("./convert");

module.exports = function(source, sourceMap) {
  const callback = this.async();

  convert(this, (err, output) => {
    if (err) {
      callback(err);
    } else {
      callback(null, output, sourceMap);
    }
  });
  return;
};
