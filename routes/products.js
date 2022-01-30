const express = require("express");
const router = express.Router();

const Products= require('../models/Product.js');


router.get(
  "/productAll",
  async (req, res) => {
   Products.find()
       .then(oProduct => {
           res.send(oProduct);
       }).catch(err => {
       res.status(500).send({
           message: err.message || "Some error occurred while retrieving the product."
       });
   });
    }
);
