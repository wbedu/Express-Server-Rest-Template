// For use with Node.js
const ms = require('./minestat');
const fs = require('fs');
const bodyParser = require("body-parser");
const app = require('express')();
const morgan = require('morgan');
const http = require("http");
const https = require("https");
const {express, certs, mcstat} = JSON.parse(fs.readFileSync('config/config.json', 'utf-8'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('trust proxy', true);

const accessLogStream = fs.createWriteStream('./logs/access.log', {flags: 'a'});
app.use(morgan('combined',  {"stream": accessLogStream}));

function ensureSecure(req, res, next){
    if(req.secure){
        // OK, continue
        return next();
    };
    res.redirect('https://' + req.hostname + req.url); // express 4.x
}

http.createServer(app).listen(80);

var options = {
    key: fs.readFileSync(certs.key),
    cert: fs.readFileSync(certs.cert),
};
var server = https.createServer(options, app).listen(express.port, function(){
    console.log("Express server listening on port " + express.port);
});

app.all('*', ensureSecure); // at top of routing calls

app.get('/mc/status',(req, res) =>{
    ms.init(mcstat.domain, mcstat.port, function(err, result)
    {
        if (err !== undefined){
            console.log(err);
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(500);
            res.end("<h1>Some 500 ERROR has occured</h1>");
        }else {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
    });
});


