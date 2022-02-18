require('dotenv').config();
var bodyParser = require('body-parser');

const express = require('express');
const cors = require('cors');
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

app.post('/api/shorturl', function(req, res) {
  res.json({
    'url': req.body['url']
  });
});