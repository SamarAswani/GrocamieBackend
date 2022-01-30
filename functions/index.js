const functions = require('firebase-functions');
const express = require("express");
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

function sendVerificationEmail(email, link) {
    var smtpConfig = {
    host: 'smtp.grocamie.com',
    port: 465,
    secure: true, // use SSL
    auth: {
         user:'info@grocamie.com',
         pass:'grocamie123'
          }
    };
    var transporter = nodemailer.createTransport(smtpConfig);
    var mailOptions = {
      from: "info@grocamie.com", // sender address
      to: email, // list of receivers
      subject: "Email Verification", // Subject line
      text: "Email Verification, press here to verify your email: " +     link,
      html: "<b>Hello there,<br> Click <a href=" + link + "> here to verify your email address and gain access to the grocamie app.</a></b>" // html body
    };
    transporter.sendMail(mailOptions, function(error, response){
      if(error){
       console.log(error);
      }else{
       console.log("Message sent: " + response.message);
      }
      smtpTransport.close(); // shut down the connection pool, no more messages
      });
    }

app.post('/verify', (request, response) => {
    var useremail = request.body["useremail"];

    function makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
     }
     
    var userIDHash = makeid(12);
    var setHash = db.collection('EmailVerification').doc(userIDHash).set({email:useremail});
    // add hash to EmailVerification collect in db where documentid is hash and the only field is email
    var verificationLink = "http://www.grocamie.com/confirm_email/" + userIDHash;
    sendVerificationEmail(useremail, verificationLink);
}); 

app.get('/confirm_email/:hash', (request, response) => {
    var hash = request.params.hash; //Get the has from the request parameter
    var hashRef = baseDB.collection('EmailVerification').doc(hash); //Get the reference for the userID document
    var getHash = hashRef.get()
   .then(doc => {
     if (!doc.exists) {
        console.log('No such document!');
     } else {
        //Getting user based on userID and updating emailverification
        admin.auth().updateUser(doc.data()['userID'], {
          emailVerified: true
        })
     .then(function(userRecord) {
 // See the UserRecord reference doc for the contents of userRecord.
 console.log("Successfully updated user", userRecord.toJSON());
      var deleteDoc = db.collection('Email-Verifications').doc(hash).delete(); //Delete the email-verification document since it is no longer needed.
     return     response.status(200).send(generateVerificationSuccessRedirect());
      })
      .catch(function(error) {
      console.log("Error updating user:", error);
      return response.status(500);
      });
    }
 })
   .catch(err => {
    console.log('Error getting document', err);
    return response.status(500);
    });
 });