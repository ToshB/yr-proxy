'use strict';
var pg = require('pg');
var conString = process.env.DATABASE_URL || 'postgres://tosh:5432@localhost/tosh';

function nearby(query, callback){
  pg.connect(conString, function(err, client, done){
    if(err){
      return callback(err, null);
    }
    client.query('select * from steder where earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(steder.lat, steder.lon);', [query.lat, query.lon, query.dist], function(err, result){
      done();

      if(err){
        return callback(err, null);
      }
      callback(null, {results: result.rows});
    });
  });
}

function search(query, callback){
  pg.connect(conString, function(err, client, done){
    var cleanedQuery = query.q.toLowerCase().trim().replace(/\s+/g, '&');
    if(err){
      return callback(err, null);
    }
    client.query('SELECT * FROM steder where to_tsvector(\'simple\', lower(name)) @@ to_tsquery(\'simple\', $1) and priority<=$2 order by priority limit 20', [cleanedQuery+':*', query.pri], function(err, result){
      done();

      if(err){
        return callback(err, null);
      }
      callback(null, {results: result.rows});
    });
  });
}

module.exports.search = search;
module.exports.nearby = nearby;
