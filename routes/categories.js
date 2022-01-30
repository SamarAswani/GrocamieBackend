const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const querystring = require('querystring');
const bodyParser = require('body-parser');
const url = require('url');
const csv = require('csv-parser');
const fs = require('fs');


const Categories = require("../model/Categories");




router.get("/getAll",async (req, res) => {
    Categories.find({})
        .then(oProduct => {
            res.send(oProduct);
        }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving the product."
        });
    });
});

// router.post("/add",
//   [],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array()
//       });
//     }

//     const {name, subcategories, img} = req.body;
//     try {

//       category = new Categories({
//         name,
//         subcategories,
//         img
//       });

//       await category.save();

//       res.status(200).json({});

//     } catch (err) {
//       console.log(err.message);
//       res.status(500).send("Error in Saving");
//     }
//   }
// );


module.exports = router;
