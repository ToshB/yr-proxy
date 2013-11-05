var pg = require('pg');
var conString = process.env.DATABASE_URL || 'postgres://tosh:5432@localhost/tosh';
console.log(conString);
function search(searchQuery, callback){
  pg.connect(conString, function(err, client, done){
    if(err){
      return callback(err, null);
    }
    client.query('SELECT * FROM steder where lower(name) LIKE $1', [searchQuery.toLowerCase()+'%'], function(err, result){
      done();

      if(err){
        return callback(err, null);
      }
      callback(null, {results: result.rows});
    });
  });
}

module.exports.search = search;
