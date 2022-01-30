const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const querystring = require('querystring');
const bodyParser = require('body-parser');
const url = require('url');
const jwt = require("jsonwebtoken");
const auth = require("../../GrocamieBackend/middleware/auth");

const Cart = require("../model/Cart");
const Community = require("../../GrocamieBackend/model/Community");
const MasterOrder = require("../model/MasterOrder");
const Order = require("../model/Order");
const MasterCart = require("../model/MasterCart");

router.post("/create", auth, async (req, res) => {

  function func() {
    return (Cart.find({_id: req.user.id}));

  };

  async function asyncCall() {
    const data = await func();
    var productCart = data[0]["products"];
    var total = data[0]["total"];

    var currentdate = new Date();
    var datetime = currentdate.getDate() + "/"
                  + (currentdate.getMonth()+1)  + "/"
                  + currentdate.getFullYear() + " @ "
                  + currentdate.getHours() + ":"
                  + currentdate.getMinutes() + ":"
                  + currentdate.getSeconds();

    order = new Order({
      _userId: req.user.id,
      timestamp: datetime,
      products: productCart,
      total: total
    });

    await order.save();

    // expected output: "resolved"
  }

  asyncCall();
  res.send("Order Created");
});


router.post("/createMaster", auth, async (req, res) => {
  if (req.user.alpha == true){

    function func() {
      return (MasterCart.find({_id: req.user.communityCode}));
    };

    async function asyncCall() {
      const data = await func();
      var productCart = data[0]["products"];
      var total = data[0]["total"];

      var currentdate = new Date();
      var datetime = currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();

      masterOrder = new MasterOrder({
        _alphaId: req.user.communityCode,
        timestamp: datetime,
        products: productCart,
        total: total
      });

      await masterOrder.save();

      // expected output: "resolved"
    }

    asyncCall();
    res.send("Master Order Created");
          }

    else {
      res.status(500).send({
          message: "The user is not a community leader."
      });
    }

});


module.exports = router;
