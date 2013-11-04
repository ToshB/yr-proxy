var pg = require('pg');

function search(){
  pg.connect(process.env.DATABASE_URL, function(err, client){
    var query = client.query('SELECT * FROM steder');

    query.on('row', function(row){
      console.log(JSON.stringify(row));
    });
  });
}

module.exports.search = search;