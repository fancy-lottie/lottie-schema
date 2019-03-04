var ghpages = require('gh-pages');

ghpages.publish('schema', function(err) {
  console.log('err', err);
});
