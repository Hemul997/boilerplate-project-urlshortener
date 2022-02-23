require('dotenv').config();
var bodyParser = require('body-parser');

const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();
app.use(bodyParser.urlencoded({extended: false}));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(function(req, res, next) {
  typeof req.headers['x-forwarded-for'] == "undefined" ? ipaddress = req.ip 
    : ipaddress = req.headers['x-forwarded-for'];
  console.log(req.method + ' ' + req.path + ' - ' + ipaddress)
  next();
});

let CurrURLId = 1;

let urlsMap = new Map()


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


app.post('/api/shorturl', function(req, res, next) {
  try {
    const { hostname , protocol } = new URL(req.body['url']);
    dns.lookup(hostname, (err) =>{
      if (err || protocol.match('http') === null) res.json({"error": "Invalid url"});
      else next();
    });
  } catch (e) {
    res.json({"error": "Invalid url"});
  }
}, function (req, res, next){
  urlsMap.set(String(CurrURLId), req.body['url']);
  res.json({
    'original_url': req.body['url'],
    'short_url': CurrURLId
  });
  CurrURLId += 1;
  console.log(Array.from(urlsMap));
});


app.get('/api/shorturl/:id?', function(req, res, next){
  if (!urlsMap.has(req.params.id)) res.json({"error": "No short URL found for the given input"});
  else next();
}, function(req, res, next) {
  res.redirect(urlsMap.get(req.params.id));
});