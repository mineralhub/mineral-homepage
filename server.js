const https = require('https');
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const serverConfig = require('./serverConfig.json');

const domain = serverConfig.domain;
const port = serverConfig.http.port;
let count = 0;

// https switching
const httpsServerOn = serverConfig.https.on;

// https redirection
if(httpsServerOn) {
  app.enable('trust proxy');
  app.use(function(req, res, next) {

      if(req.host.indexOf(domain) == -1)
        return next();
      
      if(req.secure && req.host.indexOf("www.") > -1 ) {
          return next();
      }

      res.redirect("https://" + (req.host.indexOf("www.") == -1 ? "www." : "") + req.headers.host + req.url);
  
      // res.redirect("https://" + (req.host.indexOf("www.") == -1 ? "www." : "") + req.headers.host + req.url);
  });
}


app.use(express.static('./'));
app.engine('html', require('ejs').renderFile);
app.set('views', './');
app.set('view engine', 'ejs');

app.get('*', function (req, res) {
	    console.log(`connect [${count++}] - ${new Date()}`);   
	    res.render('index.html');
});

app.listen(port, function (req, socket, head) {
	    console.log('listening on port ' + port + '!');
});


// https server
let httpsServer = null;
let httpsOption = {
  key: "key",
  cert: "cert",
  ca: "ca"
}
if(httpsServerOn) {
  httpsOption.key = fs.readFileSync(serverConfig.https.keys.key, 'utf8');
  httpsOption.cert = fs.readFileSync(serverConfig.https.keys.cert, 'utf8');
  httpsOption.ca = fs.readFileSync(serverConfig.https.keys.ca, 'utf8');

  httpsServer = https.createServer(httpsOption, app);
  httpsServer.listen(serverConfig.https.port, () => console.log(`https server is listening to the port ${serverConfig.https.port}`));
}