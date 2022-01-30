const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");
const mongoose = require('mongoose');
const util = require('util');

const Distributor = require("../model/Distributor");
const Manufacturer = require("../model/Manufacturer");
const MasterOrder = require("../model/MasterOrder");
const Order = require("../model/Order");
const User = require("../model/User");
const Product = require("../model/Product");



router.post("/signup",
  [
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const {email,contact,deliveryDay,username,name,profileUrl,verified,password,manufacturer,location} = req.body;
    try {
      let distributor = await Distributor.findOne({
        username
      });
      if (distributor) {
        return res.status(400).json({
          msg: "Distributor Already Exists"
        });
      }

      distributor = new Distributor({
        email,
        contact,
        deliveryDay,
        username,
        name,
        profileUrl,
        verified,
        password,
        manufacturer,
        location
      });

      const salt = await bcrypt.genSalt(10);
      distributor.password = await bcrypt.hash(password, salt);

      await distributor.save();

      // var i;
      // var manufacturers = [];
      // for (i = 0; i < distributor.manufacturer.length; i++) {
      //   manufacturers.push(distributor.manufacturer[i].manufacturerId);
      // }

      const payload = {
        user: {
          _id: distributor.id,
          name: distributor.name,
          manufacturer: distributor.manufacturer
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

router.post("/login",
  [
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { username, password } = req.body;
    try {
      let distributor = await Distributor.findOne({
        username
      });
      if (!distributor)
        return res.status(400).json({
          message: "Distributor Does Not Exist"
        });

      const isMatch = await bcrypt.compare(password, distributor.password);
      if (!isMatch)
        return res.status(400).json({
          message: "Incorrect Password !"
        });



      const payload = {
        user: {
          _id: distributor.id,
          name: distributor.name,
          manufacturer: distributor.manufacturer
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 36000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);

router.get("/me", auth, async (req, res) => {
  try {
    const distributor = await Distributor.findById(req.user._id);
    res.json(distributor);
  } catch (e) {
    res.send({ message: "Error in Fetching distributor" });
  }
});

router.get("/getCurrentOrders", auth, async (req, res) => {
  try {
    // const order = await Order.find({active:true});
    // {"products._manufacturerId" : req.user.manufacturer},{products: {$elemMatch: {_productId: {$in: req.user.manufacturer}}}}
    // const order = await Order.find({products: {$elemMatch: {_manufacturerId: {$in: req.user.manufacturer}}}});
    // const order = await Order.find({"products._manufacturerId": {$in: req.user.manufacturer}},);
    const order = await Order.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":true }},
      { $project: {
          products: { $filter: {
              input: '$products',
              as: 'products',
              cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
          }}
      }}
    ]);
    // console.log(order);
    res.json(order);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getPastOrders", auth, async (req, res) => {
  try {
    // const order = await Order.find({active:true});
    // {"products._manufacturerId" : req.user.manufacturer},{products: {$elemMatch: {_productId: {$in: req.user.manufacturer}}}}
    // const order = await Order.find({products: {$elemMatch: {_manufacturerId: {$in: req.user.manufacturer}}}});
    // const order = await Order.find({"products._manufacturerId": {$in: req.user.manufacturer}},);
    const order = await Order.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":false }},
      { $project: {
          products: { $filter: {
              input: '$products',
              as: 'products',
              cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
          }}
      }}
    ]);
    // console.log(order);
    res.json(order);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getCurrentPrices", auth, async (req, res) => {
  try {
    const order = await Order.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":true }},
      { $project: {
        'price': {
          $reduce:{
            input:{
                $map: {
                  input: {
                    $filter: {
                      input: '$products',
                      as: 'products',
                      cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
                    }
                  },
                  as: 'productTotal',
                  in: { $multiply:['$$productTotal._sp','$$productTotal.quantity'] }
                }
            },
            initialValue: 0,
            in: {$add : ["$$value", "$$this"] }
          }
        }
        }}
    ]);

    res.json(order);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getPastPrices", auth, async (req, res) => {
  try {
    const order = await Order.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":false }},
      { $project: {
        'price': {
          $reduce:{
            input:{
                $map: {
                  input: {
                    $filter: {
                      input: '$products',
                      as: 'products',
                      cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
                    }
                  },
                  as: 'productTotal',
                  in: { $multiply:['$$productTotal._sp','$$productTotal.quantity'] }
                }
            },
            initialValue: 0,
            in: {$add : ["$$value", "$$this"] }
          }
        }
        }}
    ]);

    res.json(order);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getCurrentAddresses", auth, async (req, res) => {
  try {
    const orders = await Order.find({"products._manufacturerId": req.user.manufacturer,"active":true},{_userId:1});

    var i;
    var addresses=[];
    for (i = 0; i < orders.length; i++) {
      const address = await User.find({_id: orders[i]["_userId"]},{address:1});
      var obj = {};
      obj["_orderId"] = orders[i]["_id"];
      obj["_userId"] = orders[i]["_userId"];
      obj["address"] = address[0]["address"];
      addresses.push(obj);
    };
    res.json(addresses);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getPastAddresses", auth, async (req, res) => {
  try {
    const orders = await Order.find({"products._manufacturerId": req.user.manufacturer,"active":false},{_userId:1});

    var i;
    var addresses=[];
    for (i = 0; i < orders.length; i++) {
      const address = await User.find({_id: orders[i]["_userId"]},{address:1});
      var obj = {};
      obj["_orderId"] = orders[i]["_id"];
      obj["_userId"] = orders[i]["_userId"];
      obj["address"] = address[0]["address"];
      addresses.push(obj);
    };
    res.json(addresses);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getCurrentMasterAddresses", auth, async (req, res) => {
  try {
    const orders = await MasterOrder.find({"products._manufacturerId": req.user.manufacturer,"active":true},{_userId:1});

    var i;
    var addresses=[];
    for (i = 0; i < orders.length; i++) {
      const address = await User.find({_id: orders[i]["_alphaId"]},{address:1});
      var obj = {};
      obj["_orderId"] = orders[i]["_id"];
      obj["_userId"] = orders[i]["_userId"];
      obj["address"] = address[0]["address"];
      addresses.push(obj);
    };
    res.json(addresses);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getPastMasterAddresses", auth, async (req, res) => {
  try {
    const orders = await MasterOrder.find({"products._manufacturerId": req.user.manufacturer,"active":false},{_userId:1});

    var i;
    var addresses=[];
    for (i = 0; i < orders.length; i++) {
      const address = await User.find({_id: orders[i]["_alphaId"]},{address:1});
      var obj = {};
      obj["_orderId"] = orders[i]["_id"];
      obj["_userId"] = orders[i]["_userId"];
      obj["address"] = address[0]["address"];
      addresses.push(obj);
    };
    res.json(addresses);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getCurrentMasterOrders", auth, async (req, res) => {
  try {
    const order = await MasterOrder.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":false }},
      { $project: {
          products: { $filter: {
              input: '$products',
              as: 'products',
              cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
          }}
      }}
    ]);
    
    res.json(order);

  } catch (e) {
    console.log(e);
  }
});

router.get("/getPastMasterOrders", auth, async (req, res) => {
  try {
    const order = await MasterOrder.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":false }},
      { $project: {
          products: { $filter: {
              input: '$products',
              as: 'products',
              cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
          }}
      }}
    ]);
    
    res.json(order);

  } catch (e) {
    console.log(e);
  }
});

router.get("/getCurrentMasterPrices", auth, async (req, res) => {
  try {
    const order = await MasterOrder.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":true }},
      { $project: {
        'price': {
          $reduce:{
            input:{
                $map: {
                  input: {
                    $filter: {
                      input: '$products',
                      as: 'products',
                      cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
                    }
                  },
                  as: 'productTotal',
                  in: { $multiply:['$$productTotal._sp','$$productTotal.quantity'] }
                }
            },
            initialValue: 0,
            in: {$add : ["$$value", "$$this"] }
          }
        }
        }}
    ]);

    res.json(order);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/getPastMasterOrders", auth, async (req, res) => {
  try {
    const order = await MasterOrder.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":false }},
      { $project: {
          products: { $filter: {
              input: '$products',
              as: 'products',
              cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
          }}
      }}
    ]);
    
    res.json(order);

  } catch (e) {
    console.log(e);
  }
});

router.get("/getPastMasterPrices", auth, async (req, res) => {
  try {
    const order = await MasterOrder.aggregate([
      { $match: { "products._manufacturerId": {$in: req.user.manufacturer}, "active":false }},
      { $project: {
        'price': {
          $reduce:{
            input:{
                $map: {
                  input: {
                    $filter: {
                      input: '$products',
                      as: 'products',
                      cond: { $in: [ '$$products._manufacturerId', req.user.manufacturer ]}
                    }
                  },
                  as: 'productTotal',
                  in: { $multiply:['$$productTotal._sp','$$productTotal.quantity'] }
                }
            },
            initialValue: 0,
            in: {$add : ["$$value", "$$this"] }
          }
        }
        }}
    ]);

    res.json(order);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.get("/products", auth, async (req, res) => {
  try {
    const maunfacturers = await Distributor.find({"_id": req.user._id});
    const manufacturersName = await Manufacturer.find({"_id": {$in: maunfacturers[0]['manufacturer']}});
    const products = await Product.find({"manufacturer": {$in: manufacturersName[0]['name']}},{"keywords":0});
    res.json(products);

  } catch (e) {
    // res.send({ message: "Error in Fetching distributor" });
    console.log(e);
  }
});

router.put(
  "/updateProduct",
  function (req, res) {
    var conditions = {_id:req.body.productId};
    var set = {$set:{"req.body.field":"req.body.newVal"}};

    Product.update(conditions, set).then(doc => {
        if (!doc) {return res.status(404).end();}
        return res.status(200).json(doc);
    })
    .catch(err => next(err));
  }
);

router.post("/addManufacturer",
  [],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const {name, communities} = req.body;
    try {

      manufacturer = new Manufacturer({
        name,
        communities
      });

      await manufacturer.save();

      res.status(200).json({});

    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

router.put(
  "/assignManufacturer",[],auth,async (req, res) => {
    var conditions = {_id: req.user._id};
    var push = {$push: {manufacturer: req.body.manufacturerId}};

    Distributor.update(conditions, push).then(doc => {
        if (!doc) {return res.status(404).end();}
        return res.status(200).json(doc);
    })
    .catch(err => next(err));
  }
);

module.exports = router;
