const fs = require("fs");
const mfs = new (require("memory-fs"))();
const path = require("path");
const transform = require("ts-runtime").transform;

const patchFs = fs => {
  fs.openSync = proxyOpenSync;
  fs.writeSync = proxyWriteSync;
  fs.closeSync = proxyCloseSync;
};

const unpatchFs = fs => {
  fs.writeSync = fsWriteSync;
  fs.openSync = fsOpenSync;
  fs.closeSync = fsCloseSync;
};

const fsOpenSync = fs.openSync;
const proxyOpenSync = function(filepath, mode) {
  if (mode === "w") {
    const symbol = Symbol();

    map.set(symbol, filepath);
    return symbol;
  }
  return fsOpenSync.call(this, filepath, mode);
};

const fsWriteSync = fs.writeSync;
const proxyWriteSync = function(fd, content) {
  if (map.has(fd)) {
    const filepath = map.get(fd);
    mfs.mkdirpSync(path.dirname(filepath));
    mfs.writeFileSync(filepath, content);
  } else {
    return fsWriteSync.apply(this, arguments);
  }
};

const fsCloseSync = fs.closeSync;
const proxyCloseSync = function(fd) {
  if (map.has(fd)) {
    map.delete(fd);
  } else {
    fsCloseSync.apply(this, arguments);
  }
};

const map = new Map();

var walkSync = function(dir, filelist) {
  const fs = mfs;
  const files = fs.readdirSync(dir);

  filelist = filelist || [];
  files.forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

function getAssets(entry, baseDir) {
  patchFs(fs); // mock fs with memory-fs.
  const data = transform([entry], {});

  unpatchFs(fs); // unmock fs.

  // Normalize resources.
  const paths = walkSync("/");

  const declarationsPath = paths[paths.length - 1];
  const declarations = {
    name: `${path.dirname(data[data.length - 1].name)}/${path.basename(
      declarationsPath
    )}`,
    text: mfs.readFileSync(declarationsPath, "utf8")
  };

  data.push(declarations);
  data.forEach(item => {
    item.parts = item.name.split("/");
  });

  const isIdentical = item =>
    item.parts.length && item.parts[0] === data[0].parts[0];

  while (data.every(isIdentical)) {
    data.forEach(item => item.parts.shift());
  }

  data.forEach(item => {
    item.name = `${baseDir}/${item.parts.join("/")}`;
    delete item.parts;
  });

  return data;
}

module.exports = getAssets;
