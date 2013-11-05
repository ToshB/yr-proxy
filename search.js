var pg = require('pg');

function search(searchQuery, callback){
  pg.connect(process.env.DATABASE_URL, function(err, client){
    if(err){
        callback(err, null);
        return;
    }
    var query = client.query('SELECT * FROM steder where place LIKE $1%', [searchQuery]),
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