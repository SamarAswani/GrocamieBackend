const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const querystring = require('querystring');
const bodyParser = require('body-parser');
const url = require('url');
const csv = require('csv-parser');
const fs = require('fs');

const SERVER_KEY =
  'AAAAZTt3e3w:APA91bHR9lVHIpEE9y9efNkD6L6RQ1HgTf9uttDOjvepznYhMXcjU29JDdcOl5y1Ot6eU4M0o530e5nL4UdPem6X-XUySUPQA5NKSnfsTMOeTgBFzeSna-GHM950BEsOejFQnqzjB-zM';


router.post("/send", async(req, res) =>{
    
    request(
    {
      url: 'https://fcm.googleapis.com/fcm/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${SERVER_KEY}`,
      },
      body: JSON.stringify(req.body),
    },
    (err, response, body) => {
      if (err) {
        console.log(err);
        res.status(400).send(err);
      } else res.send(body);
    }
  );

});


module.exports = router;
