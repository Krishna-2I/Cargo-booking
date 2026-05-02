const fs = require('fs');
const path = require('path');
const stripComments = require('strip-comments');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function removeComments(dir) {
  walk(dir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(file, 'utf8');
        const stripped = stripComments(content);
        if (content !== stripped) {
          fs.writeFileSync(file, stripped, 'utf8');
          console.log(`Stripped comments from ${file}`);
        }
      }
    });
  });
}

removeComments(path.join(__dirname, 'frontend/src'));
removeComments(path.join(__dirname, 'backend/src'));
