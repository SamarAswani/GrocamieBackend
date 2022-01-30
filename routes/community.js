const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");

const Community = require("../model/Community");
const User = require("../model/User");

router.post(
  "/create",[],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const {betaUsers,name,requests,closingTime} = req.body;
    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
         result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
   
    var communityCode = makeid(5);

    try {
      community = new Community({
        communityCode,
        betaUsers,
        name,
        requests,
        closingTime
      });

      await community.save();
      var conditions = {communityCode: user.communityCode};
      var push = {$push: {betaUsers: user.id}};

      Community.update(conditions,push).then(doc => {
            if (!doc) {return res.status(404).end();}
            console.log('yes');
            // return res.status(200).json(doc);
      })
      .catch(err => next(err));

      res.status(200).json({
        community
      });

    }
    catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);

router.put(
  "/setClosingTime",
  function (req, res) {
    if(req.user.alpha==1){
      var conditions = {_id: req.user.communityCode};
      var set = {$set:{closingTime:req.body.closingTime}};
      Community.update(conditions, set).then(doc => {
          if (!doc) {return res.status(404).end();}
          return res.status(200).json(doc);
      })
      .catch(err => next(err));
    }
  }
);

router.get("/closingTime", auth, async (req, res) => {
  try {
      const time = await Community.find({communityCode:req.user.communityCode},{closingTime:1});
      if(time && time.length){
          res.json(time);
      }
      else{
          res.json("0 (no closing time)");
      }
  }
  catch (e) {
       res.send({ message: "Error in Fetching user" });
  }
});

router.put(
    "/approve",[],auth,
    async (req, res) => {
      if(req.user.alpha==1){
      // {
      //   id:
      // }
      var conditions = {communityCode: req.user.communityCode};
      var push = {$push: {betaUsers: req.body.id}};
      var pull = {$pull: {requests:req.body.id }};

      Community.update(conditions,push).then(doc => {
          if (!doc) {return res.status(404).end();}
          return res.status(200).json(doc);
      })
      .catch(err => next(err));

      Community.update(conditions,pull).then(doc => {
        if (!doc) {return res.status(404).end();}
        return res.status(200).json(doc);
      })
      .catch(err => next(err));
      
      User.update({_id:req.body.id},{communityCode:req.user.communityCode}).then(doc => {
        if (!doc) {return res.status(404).end();}
        return res.status(200).json(doc);
      })
      .catch(err => next(err));
    }
  }
  );

router.get("/requests", auth, async (req, res) => {
  if(req.user.alpha==1){
    try {
      const user = await Community.find({communityCode: req.user.communityCode},{requests:1});
      res.json(user);
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
  }
  else{
    res.json({ message: "Not alpha user" })
  }
});

router.get("/members", auth, async (req, res) => {
    try {
      const user = await Community.find({communityCode: req.user.communityCode},{betaUsers:1});
      res.json(user);
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
});

module.exports = router;