const express = require("express");
const router = express.Router();
const querystring = require('querystring');
const bodyParser = require('body-parser');
const url = require('url');
const csv = require('csv-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./admin.json');
const { createInvoice } = require('./createInvoice');
const fs = require('fs');
const { strict } = require("assert");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://grocamie.firebaseio.com',
  authDomain: 'grocamie.firebaseapp.com',
});



router.post("/generate", async (req, res) => {
  async function generateInvoices(orderId, num) {
  try{  
    var oldNum = num
    const db = admin.firestore();
    const messaging = admin.messaging();
    const ordersList = await db
    .collection('Orders')
    .where('masterCartId', '==', orderId)
    .get();

  ordersList.docs.forEach((snap, index) => {
    num++;
    const order = snap.data();
    const invoice = {
      shipping: {
        name: order.name,
        address: order.address,
        state: 'Delhi',
        country: 'India',
      },
      items: order.productsList,
      paid: order.paymentStatus !== 'Unpaid',
      invoice_nr: num,
      date: order.createdAt.toDate(),
    };
    createInvoice(
      invoice,
      fs.createWriteStream(`Invoices/${num}.pdf`)
    );

    
});

  fs.readFile('invoiceMap.txt', 'utf-8', function(err, data) {
    if (err) throw err;
    console.log(data.toString())

    var map = data.toString() + (oldNum+1).toString() + ' - ' + num.toString() + " : " + orderId + "\n"

      fs.writeFile('invoiceMap.txt', map, 'utf-8', function(err, data) {
        if (err) throw err;

      })

  });

  fs.readFile('invoiceNumber.txt', 'utf-8', function(err, data) {
    if (err) throw err;

    var newValue = data.toString().replace(oldNum, num);
 
      fs.writeFile('invoiceNumber.txt', newValue, 'utf-8', function(err, data) {
        if (err) throw err;
  
      })
 
})
}
catch (e) {

    // var newStatus = data.toString().replace("e", "a");
    //   fs.writeFile('invoiceNumber.txt', newStatus, 'utf-8', function(err, data) {
    //     if (err) throw err;
  
    //   })
  res.send(e);
}

  
}
  try {

  var {orderId} = req.body;

    fs.readFile('invoiceNumber.txt', function (err, data) {
      if (err) {
        return console.error(err);
      }
      var num = Number((data.toString()).split(/\r?\n/)[0]);
      // ERROR HANDLING
      // var status = (data.toString()).split(/\r?\n/)[1];
      // while (status != 'a'){
      //   fs.readFile('invoiceNumber.txt', function (err, data) {
      //     if (err) {
      //       return console.error(err);
      //     }
      //     status = (data.toString()).split(/\r?\n/)[1];
      //   });

      // }
      // var newStatus = data.toString().replace("a", "e");
 
      // fs.writeFile('invoiceNumber.txt', newStatus, 'utf-8', function(err, data) {
      //   if (err) throw err;
  
      // })
  

      generateInvoices(orderId, num);

      // var newStatus = data.toString().replace("e", "a");
 
      // fs.writeFile('invoiceNumber.txt', newStatus, 'utf-8', function(err, data) {
      //   if (err) throw err;
  
      // })


      res.send("done");
    });
    
  }
  catch (e) {
    res.send(e);
  }
});

module.exports = router;


