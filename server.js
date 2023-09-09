
// must install load dotenv to be able to use .env file
require('dotenv').config();

var fs = require('fs');

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;  // for http



var port_https = process.env.PORT_https || 8080; // for https




// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
/*

    fix error: 
                  The origin "" was not whitelisted by the operator of this proxy
    https://github.com/Rob--W/cors-anywhere/issues/217
    You need to remove export CORSANYWHERE_WHITELIST=* from your start script.

    If you still have the same shell from where you've run the above commands, use unset CORSANYWHERE_WHITELIST or export CORSANYWHERE_WHITELIST= to clear the value of the environment variable.

*/

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}



console.log('port, http, https : ', port, port_https)
console.log('originWhitelist', originWhitelist)






// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);



// ************** http ***************************


        var cors_proxy = require('./lib/cors-anywhere');


        cors_proxy.createServer({

          originBlacklist: originBlacklist,
          //originWhitelist: originWhitelist,
          originWhitelist: [], // Allow all origins



          // fix --- https://github.com/Rob--W/cors-anywhere/issues/39
          // requireHeader: ['origin', 'x-requested-with'],
          requireHeader: [],

          checkRateLimit: checkRateLimit,
          removeHeaders: [
           // 'cookie',  // I want to keep "document.cookie" from original ajax url request
           // 'cookie2',
            // Strip Heroku-specific headers
            'x-heroku-queue-wait-time',
            'x-heroku-queue-depth',
            'x-heroku-dynos-in-use',
            'x-request-start',
          ],
          redirectSameOrigin: true,
          httpProxyOptions: {
            // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
            xfwd: false,
          },
        }).listen(port, host, function() {
          console.log('Running CORS Anywhere http :  ' + host + ':' + port);
        });


// ************** end *************  http ***************************





// ************** https ***************************
        var cors_proxy_https = require('./lib/cors-anywhere');


        cors_proxy_https.createServer({

        // add https support  
        //https://github.com/Rob--W/cors-anywhere/issues/74



          httpsOptions: {
            key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
            cert: fs.readFileSync(__dirname + '/public.cert', 'utf8')
          },


// ********** end **** https ***************************

  originBlacklist: originBlacklist,
  //originWhitelist: originWhitelist,
  originWhitelist: [], // Allow all origins

  // fix --- https://github.com/Rob--W/cors-anywhere/issues/39
  // requireHeader: ['origin', 'x-requested-with'],
  requireHeader: [],

  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-heroku-queue-wait-time',
    'x-heroku-queue-depth',
    'x-heroku-dynos-in-use',
    'x-request-start',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port_https, host, function() {
  console.log('Running CORS Anywhere https ' + host + ':' + port_https);
});
