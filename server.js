require('dotenv').config();
var bodyParser = require('body-parser');

const express = require('express');
const cors = require('cors');
const dns = require('dns');

const TIMEOUT = 10000;
let lastShortUrl = 1;

let mongoose;
try {
  mongoose = require("mongoose");
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (e) {
  console.log(e);
}

let urlSchema = new mongoose.Schema({
  short_url: {
    type: Number,
    required: true
  },
  original_url: {
    type: String,
    required: true
  }
});

let ShortUrl = mongoose.model('urls', urlSchema);

const createUrlAndSave = (shortUrl, originalUrl, done) => {
  let short_url = shortUrl;
  let original_url = originalUrl;

  let createdUrl = ShortUrl({short_url, original_url});

  createdUrl.save(function(err, data){
    if (err) return done(err);
    done(null, data);
  });
};

const findOriginalUrl = (url_id, done) => {
  ShortUrl.find({short_url: url_id}, function(err, data) {
    if (err) return done(err);
    done(null, data);
  });
};

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


app.post('/api/shorturl', function(req, res, next) {
  try {
    const {hostname , protocol} = new URL(req.body['url']);

    dns.lookup(hostname, (err, address, family) =>{
      if (err || protocol.match('http') === null) res.json({"error": "Invalid url"});
      else {
        console.log('address: %j family: IPv%s', address, family);
        
        let t = setTimeout(() => {
          next({ message: "timeout" });
        }, TIMEOUT);
        createUrlAndSave(lastShortUrl, req.body['url'], function(err, data) {
          clearTimeout(t);
          if (err) {
            return next(err);
          }
          if (!data) {
            console.log("Missing `done()` argument");
            return next(res.json({"error": "Invalid url"}));
          }
          res.json({
            'original_url': req.body['url'],
            'short_url': lastShortUrl
          });
          lastShortUrl += 1;
        })
      }
    });
  } catch (e) {
    console.log(e);
    res.json({"error": "Invalid url"});
  }
});


app.get('/api/shorturl/:id?', function(req, res){
  try {
    let t = setTimeout(() => {
      next({ message: "timeout" });
    }, TIMEOUT);
    findOriginalUrl(req.params.id, function(err, data) {
      clearTimeout(t);
      if (err) {
        return next(err, res.json({"error": "No short URL found for the given input"}));
      }
      if (!data) {
        console.log("Missing `done()` argument");
        return next(res.json({"error": "No short URL found for the given input"}));
      }
      console.log(data[0].original_url)
      res.redirect(data[0].original_url)
    });
  } catch(e) {
    console.log(e);
    res.json({"error": "No short URL found for the given input"});
  }
});