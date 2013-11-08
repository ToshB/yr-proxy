var redis = require('redis'),
    rtg = process.env.REDISTOGO_URL ? require('url').parse(process.env.REDISTOGO_URL) : null,
    redisClient = null;

if(rtg){
  redisClient = redis.createClient(rtg.port, rtg.hostname);
  redisClient.auth(rtg.auth.split(':')[1]);
}else{
  redisClient = redis.createClient();
}

redisClient.on('error', function (err) {
  console.log('Error ' + err);
});

function getCachedJson(path, callback){
  redisClient.get(path, function (err, responseDataString){
    var responseData = JSON.parse(responseDataString);
    if(responseData){
      responseData.expires = new Date(responseData.expires);
      callback(err, responseData);
    }else{
      callback(null, null);
    }
  });
}

function cacheJson(path, json, lifetimeInSeconds){
  var data = {body: json, expires: new Date()};
  data.expires.setSeconds(data.expires.getSeconds() + lifetimeInSeconds);
  redisClient.set(path, JSON.stringify(data));
  redisClient.expire(path, lifetimeInSeconds);
  return data;
}

function getStats(callback){
  redisClient.keys('*', function (err, keys){
    callback(err, !err ? {'keys': keys} : null);
  });
}


module.exports.getCachedJson = getCachedJson;
module.exports.cacheJson = cacheJson;
module.exports.getStats = getStats;
