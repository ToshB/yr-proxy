var pg = require('pg');

function search(query, callback){
  pg.connect(process.env.DATABASE_URL, function(err, client){
    var query = client.query('SELECT * FROM steder where place LIKE $1%', [query]),
    	rows = [];

    query.on('row', function(row){
    	rows.push(row);
    });

    query.on('end', function (){
    	client.end();
    	callback(err, {results: rows});
    })
  });
}

module.exports.search = search;