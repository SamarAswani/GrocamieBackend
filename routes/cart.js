const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const querystring = require('querystring');
const bodyParser = require('body-parser');
const url = require('url');
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const mongoose = require('mongoose');


const Cart = require("../model/Cart");
const Community = require("../model/Community");
const MasterCart = require("../model/MasterCart");
const Product = require("../model/Product");
const Manufacturer = require("../model/Manufacturer");

mongoose.set('useFindAndModify', false);


router.get("/get", auth, async (req, res) => {

  Cart.find({_id: req.user.id})
         .then(oCart => {
             res.send(oCart);
         }).catch(err => {
         res.status(500).send({
             message: err.message || "Some error occurred while retrieving the product."
         });
     });
});

router.post("/add", auth, async (req, res) => {

// !!This function can be used to decrease quantity as well!!

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }
  // const manufacturerId = await Manufacturer.find({_id : req.user.manufacturer},{products:1});

//{_id: productId, quantity: 1}}}, {upsert: true})
  const {productId, quantity}= req.body;

  try{
    const manufacturerName = await Product.find({_id : productId},{manufacturer:1,sp:1});
    const manufacturerId = await Manufacturer.find({name:manufacturerName[0]['manufacturer']});

    Cart.find({_id: req.user.id, products: {$elemMatch: {_productId: productId}}}, (err, data) => {
      // Cart.update(conditions, {$inc: {"products.$.quantity":quantityToAdd}});
      
      console.log(data);

      if(!Array.isArray(data) || !data.length){

        Cart.updateOne({_id: req.user.id}, {$push: {products:{_productId: productId, _manufacturerId: manufacturerId[0]['_id'], _sp: manufacturerName[0]['sp'], quantity: quantity}}})
            .then(oCart => {
                    res.send(oCart);
                }).catch(err => {
                res.status(500).send({
                    message: err.message || "Some error occurred while retrieving the product."
                });
            });

      }
      else{

        Cart.findOneAndUpdate({_id: req.user.id, products: {$elemMatch: {_productId: productId}}}, {$inc: {"products.$.quantity":quantity}}, {new: true}, (err, data) => {

          if((data["products"].find(product => product._productId === productId).quantity) <= 0) {

            Cart.update({_id: req.user.id}, {$pull: {"products": {"_productId": productId}}})
                  .then(oCart => {
                          res.send(oCart);
                      }).catch(err => {
                      res.status(500).send({
                          message: err.message || "Some error occurred while retrieving the product."
                      });
                  });


        }



        });

      }
    });
  }catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Saving");
  }


    var communityCode = req.user.communityCode;

    const manufacturerName = await Product.find({_id : productId},{manufacturer:1,sp:1});
    const manufacturerId = await Manufacturer.find({name:manufacturerName[0]['manufacturer']});
    console.log(manufacturerName[0]['sp']);
    MasterCart.find({_id: communityCode, products: {$elemMatch: {_productId: productId}}}, (err, data) => {
      // Cart.update(conditions, {$inc: {"products.$.quantity":quantityToAdd}});


      if(!Array.isArray(data) || !data.length){
        MasterCart.updateOne({_id: communityCode}, {$push: {products:{_productId: productId, _manufacturerId:manufacturerId[0]['_id'], _sp: manufacturerName[0]['sp'], quantity: quantity}}})
            .then(oCart => {
                    res.send(oCart);
                 }).catch(err => {
                 res.status(500).send({
                     message: err.message || "Some error occurred while retrieving the product."
                 });
             });
      }
      else{

        MasterCart.findOneAndUpdate({_id: communityCode, products: {$elemMatch: {_productId: productId}}}, {$inc: {"products.$.quantity":quantity}}, {new: true}, (err, data) => {

          if((data["products"].find(product => product._productId === productId).quantity) <= 0) {

            MasterCart.update({_id: communityCode}, {$pull: {"products": {"_productId": productId}}})
                  .then(oCart => {
                          res.send(oCart);
                       }).catch(err => {
                       res.status(500).send({
                           message: err.message || "Some error occurred while retrieving the product."
                       });
                   });

          }
        });

      }

      Product.find({_id: productId}, (err, data) => {
        var price = data[0]["sp"];

          Cart.updateOne({_id: req.user.id}, {$inc: {"total":(quantity*price)}})
              .then(oCart => {
                      res.send(oCart);
                   }).catch(err => {
                   res.status(500).send({
                       message: err.message || "Some error occurred while retrieving the product."
                   });
               });




        MasterCart.updateOne({_id: communityCode}, {$inc: {"total":(quantity*price)}})
            .then(oCart => {
                    res.send(oCart);
                 }).catch(err => {
                 res.status(500).send({
                     message: err.message || "Some error occurred while retrieving the product."
                 });
             });


      });

  });



});

router.post("/delete", auth, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }


  const {productId}= req.body;

  var communityCode = req.user.communityCode;

  Cart.find({_id: req.user.id, products: {$elemMatch: {_productId: productId}}}, (err, data) => {

    var quantity = -1 * (data[0]["products"].find(product => product._productId === productId).quantity);

    Cart.update({_id: req.user.id}, {$pull: {"products": {"_productId": productId}}})
        .then(oCart => {
                res.send(oCart);
             }).catch(err => {
             res.status(500).send({
                 message: err.message || "Some error occurred while retrieving the product."
             });
         });

         MasterCart.findOneAndUpdate({_id: communityCode, products: {$elemMatch: {_productId: productId}}}, {$inc: {"products.$.quantity":quantity}}, {new: true}, (err, data) => {

           if((data["products"].find(product => product._productId === productId).quantity) <= 0) {

             MasterCart.update({_id: communityCode}, {$pull: {"products": {"_productId": productId}}})
                   .then(oCart => {
                           res.send(oCart);
                        }).catch(err => {
                        res.status(500).send({
                            message: err.message || "Some error occurred while retrieving the product."
                        });
                    });
          }
        });


          Product.find({_id: productId}, (err, data) => {
            var price = data[0]["sp"];

              Cart.updateOne({_id: req.user.id}, {$inc: {"total":(quantity*price)}})
                  .then(oCart => {
                          res.send(oCart);
                       }).catch(err => {
                       res.status(500).send({
                           message: err.message || "Some error occurred while retrieving the product."
                       });
                   });




            MasterCart.updateOne({_id: communityCode}, {$inc: {"total":(quantity*price)}})
                .then(oCart => {
                        res.send(oCart);
                     }).catch(err => {
                     res.status(500).send({
                         message: err.message || "Some error occurred while retrieving the product."
                     });
                 });


          });

});

});


router.get("/masterCart", auth, async (req, res) => {

  if (req.user.alpha == true)
  {
    MasterCart.find({_id: req.user.id})
        .then(oCart => {
                res.send(oCart);
             }).catch(err => {
             res.status(500).send({
                 message: err.message || "Some error occurred while retrieving the product."
             });
         });

  }
  else {
    res.status(500).send({
        message: "The user is not a community leader."
    });
  }
});

module.exports = router;