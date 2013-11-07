'use strict';
var pg = require('pg');
var conString = process.env.DATABASE_URL || 'postgres://tosh:5432@localhost/tosh';
function search(query, callback){
  pg.connect(conString, function(err, client, done){
    if(err){
      return callback(err, null);
    }
    client.query('SELECT * FROM steder where to_tsvector(\'simple\', lower(name)) @@ to_tsquery(\'simple\', $1) and priority<=$2 order by priority limit 20', [query.q.toLowerCase()+':*', query.pri], function(err, result){
      done();

      if(err){
        return callback(err, null);
      }
      callback(null, {results: result.rows});
    });
  });
}

module.exports.search = search;
