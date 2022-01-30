const express = require("express");
const bodyParser = require("body-parser");
const user = require("./routes/user"); //new addition
const distributor = require("./routes/distributor"); //new addition
const product = require("./routes/product"); //new addition
const community = require("./routes/community");
const categories = require("./routes/categories"); //new addition
const cart = require("./routes/cart");
const fcm = require("./routes/fcm");
const order = require("./routes/order");
const invoice = require("./routes/invoice/generateInvoices");
const cors = require('cors');

const request = require('request');

const InitiateMongoServer = require("./config/db");

const Razorpay = require('razorpay');

const instance = new Razorpay({
  key_id: 'rzp_live_EXuMe0xxkkyLZt',
  key_secret: '3yLa2rIp38JN17i4fGyNFo1e',
});


InitiateMongoServer();

const app = express();

// PORT
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "API Working" });
});


app.use("/user", user);
app.use("/distributor", distributor);
app.use("/product", product);
app.use("/community", community);
app.use("/cart", cart);
app.use("/order", order);
app.use("/categories", categories);
app.use("/invoice", invoice)
// app.use("/fcm", fcm)

const SERVER_KEY =
  'AAAAZTt3e3w:APA91bHR9lVHIpEE9y9efNkD6L6RQ1HgTf9uttDOjvepznYhMXcjU29JDdcOl5y1Ot6eU4M0o530e5nL4UdPem6X-XUySUPQA5NKSnfsTMOeTgBFzeSna-GHM950BEsOejFQnqzjB-zM';
app.post('/fcm/send', (req, res) => {
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

app.post('/orders', (req, res) => {
  instance.orders.create(req.body, (err, order) => {
    if (err) {
      res.status(400).json(err);
    } else {
      res.json(order);
    }
  });
});

app.listen(PORT, (req, res) => {
  console.log(`Server Started at PORT ${PORT}`);
});
