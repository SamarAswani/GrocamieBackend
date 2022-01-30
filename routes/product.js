const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const querystring = require('querystring');
const bodyParser = require('body-parser');
const url = require('url');
const csv = require('csv-parser');
const fs = require('fs');


const Product = require("../model/Product");
const Manufacturer = require("../model/Manufacturer");

router.get("/all",async (req, res) => {
     Product.find({})
         .then(oProduct => {
             res.send(oProduct);
         }).catch(err => {
         res.status(500).send({
             message: err.message || "Some error occurred while retrieving the product."
         });
     });
});

router.get("/getBanners",async (req, res) => {
  var banners = ["https://www.grocamie.com/img/Banner1@2x.png", "https://www.grocamie.com/img/Banner2@2x.png", "https://www.grocamie.com/img/Banner3@2x.png", "https://www.grocamie.com/img/Banner5@2x.png", "https://www.grocamie.com/img/Banner6@2x.png", "https://www.grocamie.com/img/Banner7@2x.png"]
  res.send(banners);
});

router.post("/productById", async (req, res) => {
  try {
    const user = await Product.find({_id:req.body.id});
    res.json(user);
  }
  catch (e) {
    res.send({ message: "Error in Fetching user" });
  }
});

// router.get("/get", async (req, res) => {
//   // const errors = validationResult(req);
//   // if (!errors.isEmpty()) {
//   //   return res.status(400).json({
//   //     errors: errors.array()
//   //   });
//   // }
//
//   const {search, category, sortKey, sortOrder, itemsPerPage, pageNo}= req.body;
//
//   var skips = itemsPerPage * (pageNo - 1)
//
//   let dbReq;
//   if (!(search == null || search == "") && !(category == null || category == "")) {
//     var searchSplit = search.split(" ");
//     dbReq = Product.find({keywords: {$in: searchSplit}, category: category});
//
//   }
//
//   else if (!(category == "" || category == null)){
//     dbReq = Product.find({keywords: category});
//   }
//
//   else {
//     var searchSplit = search.split(" ");
//     dbReq = Product.find({keywords: {$in: searchSplit}});
// }
// // If sortKEy present
// if (!(sortKey == null || sortKey == "")){
//   var query = {};
//   query[sortKey] = sortOrder;
//   dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
//   dbReq.then(oProduct => {
//     res.send(oProduct);
//   }).catch(err => {
//     res.status(500).send({
//       message: err.message || "Some error occurred while retrieving the product."
//     });
//   })
// }
// else {
//   res.send(dbReq)
// }
// });

router.post("/get", async(req, res) => {

  var {search, category, subCategory, sortKey, sortOrder, itemsPerPage, pageNo, community, searchType}= req.body;
  
  var skips = itemsPerPage * (pageNo - 1)
  var agg = false
  let dbReq;

  if (!(community == null || community == "")){
    community = ""
  }

  if (category == "Biscuits, Snacks & Chocolates"){
    category = "Confectionery and Snacks "
  }

  if (category == "Confectionery & Snacks"){
    category = "Confectionery and Snacks "
  }

  if (searchType == "Best Seller"){
    sortKey = "PriorityIndex"
    sortOrder = -1
  }
  else if (searchType == "Lowest Prices"){
    sortKey = "discount"
    sortOrder = -1
  }
  else if (searchType == "Local Products"){
    var brand = "Rapid"
  }


  function func() {
    return (Manufacturer.find({communities: community}, {_id:0, communities:0}));

  };

  
  try {

   
  if  (!(community == null || community == "")){

    var data = await func();
   
   var deliver = data.map(function(data) {return data['name'];
});

    if (brand == "Rapid") {
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({brand: brand, manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
    }
  
      else{
        dbReq = Product.find({brand: brand, manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
  
      }

    }

    else if (!(subCategory == null || subCategory == "")) {
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({subCategory: subCategory, manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
    }
  
      else{
        dbReq = Product.find({subCategory: subCategory, manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
  
      }

    }

    else if (!(search == null || search == "") && !(category == null || category == "")) {

      agg = true
  
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
  
        dbReq = await Product.aggregate(
          [
            {$match: { $text: {$search: search}, category: category, manufacturer: {$in: deliver}, availability: "Y"}},
            {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
            {$sort: {sortValue:-1}},
            {$match: { sortValue: { $gt: 0.5 } } },
            {$sort: query},
            {$skip: skips},
            {$limit: itemsPerPage}
            ]);
      }
      else {
        dbReq = await Product.aggregate(
          [
            {$match: { $text: {$search: search}, category: category, manufacturer: {$in: deliver}, availability: "Y"}},
            {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
            {$sort: {sortValue:-1}},
            {$match: { sortValue: { $gt: 0.5 } } },
            {$skip: skips},
            {$limit: itemsPerPage}
            ]);
  
      }
    }
  
  
  
    else if (!(category == "" || category == null)){
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({category: category, manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
    }
  
      else{
        dbReq = Product.find({category: category, manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
  
      }
  }
    else if ((category == "" || category == null) && (search == null || search == "")){
  
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
      }
      else {
        dbReq = Product.find({manufacturer: {$in: deliver}, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
      }
  }
  
    else {
      agg = true
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = await Product.aggregate(
          [
            {$match: { $text: {$search: search}, manufacturer: {$in: deliver}, availability: "Y"}},
            {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
            {$sort: {sortValue:-1}},
            { $match: { sortValue: { $gt: 0.5 } } },
            {$sort: query},
            {$skip: skips},
            {$limit: itemsPerPage}
          ]
          );
      }
    else{
      dbReq = await Product.aggregate(
        [
          {$match: { $text: {$search: search}, manufacturer: {$in: deliver}, availability: "Y"}},
          {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
          {$sort: {sortValue:-1}},
          { $match: { sortValue: { $gt: 1.0 } } },
          {$skip: skips},
          {$limit: itemsPerPage}
        ]
        );
  
    }
  
  }
  
  if (agg == false){
  dbReq.then(oProduct => {
    res.send(oProduct);
  }).catch(err => {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving the product."
    });
  })
  }
  else {
    res.json(dbReq);
  }

  }
//////////////////////////////////////////////////////
  else{

    if (brand == "Rapid") {
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({brand: brand, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
    }
  
      else{
        dbReq = Product.find({brand: brand, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
  
      }

    }

    else if (!(subCategory == null || subCategory == "")) {
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({subCategory: subCategory, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
    }
  
      else{
        dbReq = Product.find({subCategory: subCategory, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
  
      }

    }

    else if (!(search == null || search == "") && !(category == null || category == "")) {

      agg = true
  
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
  
        dbReq = await Product.aggregate(
          [
            {$match: { $text: {$search: search}, category: category, availability: "Y"}},
            {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
            {$sort: {sortValue:-1}},
            {$match: { sortValue: { $gt: 0.5 } } },
            {$sort: query},
            {$skip: skips},
            {$limit: itemsPerPage}
            ]);
      }
      else {
        dbReq = await Product.aggregate(
          [
            {$match: { $text: {$search: search}, category: category, availability: "Y"}},
            {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
            {$sort: {sortValue:-1}},
            {$match: { sortValue: { $gt: 0.5 } } },
            {$skip: skips},
            {$limit: itemsPerPage}
            ]);
  
      }
    }
  
  
  
    else if (!(category == "" || category == null)){
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({category: category, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
    }
  
      else{
        dbReq = Product.find({category: category, availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
  
      }
  }
    else if ((category == "" || category == null) && (search == null || search == "")){
  
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = Product.find({availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
      }
      else {
        dbReq = Product.find({availability: "Y"}).sort({PriorityIndex:-1});
        dbReq = dbReq.skip(skips).limit(itemsPerPage);
      }
  }
  
    else {
      agg = true
      if (!(sortKey == null || sortKey == "")){
        var query = {};
        query[sortKey] = sortOrder;
        dbReq = await Product.aggregate(
          [
            {$match: { $text: {$search: search}, availability: "Y"}},
            {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
            {$sort: {sortValue:-1}},
            { $match: { sortValue: { $gt: 0.5 } } },
            {$sort: query},
            {$skip: skips},
            {$limit: itemsPerPage}
          ]
          );
      }
    else{
      dbReq = await Product.aggregate(
        [
          {$match: { $text: {$search: search}, availability: "Y"}},
          {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
          {$sort: {sortValue:-1}},
          { $match: { sortValue: { $gt: 1.0 } } },
          {$skip: skips},
          {$limit: itemsPerPage}
        ]
        );
  
    }
  
  }
  
  if (agg == false){
  dbReq.then(oProduct => {
    res.send(oProduct);
  }).catch(err => {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving the product."
    });
  })
  }
  else {
    res.json(dbReq);
  }
  }
  
 
  

}

catch(e){
  console.log(e)
}

});

// try {
//   const product = await Product.aggregate(
//     [
//       {$match: { $text: { $search: search }, availability: "Y"}},
//       {$addFields: {sortValue:{$add: [{$meta: "textScore"}, {$divide: ["$PriorityIndex", 10]}]}}},
//       {$sort: {sortValue:-1}}
//       { $match: { sortValue: { $gt: 0.5 } } }
//     ]
//     );
//
//     res.json(product);
//
//   }
//
//   catch (e){
//     console.log(e);
//   }
//
// });

router.post("/getOld", async (req, res) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({
  //     errors: errors.array()
  //   });
  // }

  const {search, category, sortKey, sortOrder, itemsPerPage, pageNo}= req.body;


  var skips = itemsPerPage * (pageNo - 1)

  let dbReq;
  if (!(search == null || search == "") && !(category == null || category == "")) {
    dbReq = Product.find({$text: {$search: search}, category: category, availability: "Y"}, { score: { $meta: "textScore" } }).sort( { score: { $meta: "textScore" } } );

  }

  else if (!(category == "" || category == null)){
    dbReq = Product.find({category: category, availability: "Y"}).sort({PriorityIndex:-1});
  }

  else if ((category == "" || category == null) && (search == null || search == "")){
    dbReq = Product.find({availability: "Y"}).sort({PriorityIndex:-1});
  }

  else {
    dbReq = Product.find({$text: {$search: search}, availability: "Y"}, { score: { $meta: "textScore" } }).sort( { score: { $meta: "textScore" } } );
}
// If sortKEy present
if (!(sortKey == null || sortKey == "")){
  var query = {};
  query[sortKey] = sortOrder;
  dbReq = dbReq.sort(query).skip(skips).limit(itemsPerPage);
  dbReq.then(oProduct => {
    res.send(oProduct);
  }).catch(err => {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving the product."
    });
  })
}
else {
  dbReq = dbReq.skip(skips).limit(itemsPerPage);
  dbReq.then(oProduct => {
    res.send(oProduct);
  }).catch(err => {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving the product."
    });
  })
}
});



router.post("/import", async (req, res) => {

  Object.size = function(obj) {
  var size = 0,
    key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

// Get the size of an object
     
   var obj = {};
   obj["empty"] = [];
   obj["newId"] = [];  


  try{
    await Product.deleteMany({});
    console.log("Products Deleted");
  }
  catch(e){
    res.send(e);
  }
  var empty = 0
  var count = 0


  fs.createReadStream('GrocamieTestingProducts.csv')
  .pipe(csv())
  .on('data', (row) => {
    empty += 1
    if (row["name"] == '' || row["name"] == "name"){
      obj["empty"].push(empty);
    }

    else{
    count+=1
    if (row["_id"] == ''){
      async function asyncCall() {
        try{
            const product = new Product({
              name : row["name"],
              brand : row["brand"],
              manufacturer : row["manufacturer"],
              PriorityIndex : row["PriorityIndex"],
              category : row["category"],
              subCategory : row["subCategory"],
              sp : row["sp"],
              marginP : row["margin%"],
              mrp : row["mrp"],
              DealerPrice : row["DealerPrice"],
              discount : row["discount"],
              gst : row["gst"],
              weight : row["weight"],
              availability : row["availability"],
              limit: row["limit"],
              description : row["description"],
              imageUrl : row["imageUrl"],
              productImageUrl : row["productImageUrl"] });
            
            obj["newId"].push(product.id); 
            await product.save();

        }
        catch(e){
          res.send(e);
        }
      }

      asyncCall();
    }
    else{
    async function asyncCall() {
      try{
          id = row["_id"].slice(9,33);
          const product = new Product({
            _id : id,
            name : row["name"],
            brand : row["brand"],
            manufacturer : row["manufacturer"],
            PriorityIndex : row["PriorityIndex"],
            category : row["category"],
            subCategory : row["subCategory"],
            sp : row["sp"],
            marginP : row["margin%"],
            mrp : row["mrp"],
            DealerPrice : row["DealerPrice"],
            discount : row["discount"],
            gst : row["gst"],
            weight : row["weight"],
            availability : row["availability"],
            limit: row["limit"],
            description : row["description"],
            imageUrl : row["imageUrl"],
            productImageUrl : row["productImageUrl"] });

          await product.save();

      }
      catch(e){
        res.send(e);
      }
    }

    asyncCall();

    // var size = Object.size(row);
    // console.log(size);
  }
}
  })
  .on('end', () => {
    obj["count"] = count;
    obj["done"] = "done";   
    res.send(obj);   

  });




});





module.exports = router;
// [{name:"Personal Care",subcategories:[{name:"Hair care",imgSub:"imageUrl"},{name:"Bath and handwash",imgSub:"imageUrl"},{name:"Oral Care",imgSub:"imageUrl"},{name:"Perfumes and deo",imgSub:"imageUrl"},{name:"Hygiene",imgSub:"imageUrl"},{name:"Skincare",imgSub:"imageUrl"},{name:"Health and medicine",imgSub:"imageUrl"}],img:"imageUrl"},{name:"Household items",subcategories:[{name:"Air fresheners",imgSub:"imageUrl"},{name:"Sanitizers and disinfectants",imgSub:"imageUrl"},{name:"Household cleaning",imgSub:"imageUrl"},{name:"Detergents",imgSub:"imageUrl"},{name:"Insect repellents",imgSub:"imageUrl"},{name:"Polish and wax",imgSub:"imageUrl"}],img:"imageUrl"},{name:"Beverages",subcategories:[{name:"Tea and coffee",imgSub:"imageUrl"},{name:"Health drinks",imgSub:"imageUrl"},{name:"Aerated Drinks",imgSub:"imageUrl"}],img:"imageUrl"},{name:"Breakfast & Dairy",subcategories:[{name:"Dairy",imgSub:"imageUrl"},{name:"Cereals",imgSub:"imageUrl"}],img:"imageUrl"},{name:"Grocery & Staples",subcategories:[{name:"Jams, honey and spreads",imgSub:"imageUrl"},{name:"Edible oil",imgSub:"imageUrl"},{name:"Masalas and spices",imgSub:"imageUrl"},{name:"Atta, Rice and Pulses",imgSub:"imageUrl"}],img:"imageUrl"},{name:"Noodles, Sauces & Instant Food",subcategories:[{name:"Noodles and pasta",imgSub:"imageUrl"},{name:"Soups and sauces",imgSub:"imageUrl"},{name:"Instant food",imgSub:"imageUrl"}],img:"imageUrl"},{name:"Confectionery & Snacks",subcategories:[{name:"Sweets",imgSub:"imageUrl"}],img:"imageUrl"}]
//[{name:"Personal Care",subcategories:[{name:"Hair care",imgSub:"https://grocamie.com/img/Hair_Care.png"},{name:"Bath and hand wash",imgSub:"https://grocamie.com/img/Bath_&_Hand_Wash.png"},{name:"Oral Care",imgSub:"https://grocamie.com/img/Oral_Care.png"},{name:"Perfumes and deo",imgSub:"https://grocamie.com/img/Perfumes_&_Deo.png"},{name:"Hygiene",imgSub:"https://grocamie.com/img/hygiene.png"},{name:"Skin care",imgSub:"https://grocamie.com/img/Skincare.png"},{name:"Health and medicine",imgSub:"https://grocamie.com/img/Health_&_Medicine.png"}],img:"https://www.grocamie.com/img/category_personal_care.png"},{name:"Household items",subcategories:[{name:"Air fresheners",imgSub:"https://grocamie.com/img/Air_Freshners.png"},{name:"Sanitizers and disinfectants",imgSub:"https://grocamie.com/img/Sanitizers_and_Disinfectants.png"},{name:"Household cleaning",imgSub:"https://grocamie.com/img/Household_Cleaning.png"},{name:"Detergents",imgSub:"https://grocamie.com/img/Detergents.png"},{name:"Insect repellents",imgSub:"https://grocamie.com/img/Insect_repellents.png"},{name:"Polish and wax",imgSub:"https://grocamie.com/img/Polish_&_Wax.png"}],img:"https://www.grocamie.com/img/category_household_items.png"},{name:"Beverages",subcategories:[{name:"Tea and coffee",imgSub:"https://www.grocamie.com/img/Tea_&_Coffee.png"},{name:"Health drinks",imgSub:"https://www.grocamie.com/img/Health_Drinks.png"},{name:"Aerated Drinks",imgSub:"https://www.grocamie.com/img/Aereated_Drinks.png"}],img:"https://www.grocamie.com/img/category_beverages.png"},{name:"Breakfast & Dairy",subcategories:[{name:"Dairy",imgSub:"https://www.grocamie.com/img/Dairy.png"},{name:"Cereals",imgSub:"https://www.grocamie.com/img/Cereal.png"}],img:"https://www.grocamie.com/img/category_breakfast_and_dairy.jpeg"},{name:"Grocery & Staples",subcategories:[{name:"Jams, honey and spreads",imgSub:"https://www.grocamie.com/img/Jams_Honey_&_Spreads.png"},{name:"Edible oil",imgSub:"https://www.grocamie.com/img/Edible_Oil.png"},{name:"Masalas and spices",imgSub:"https://www.grocamie.com/img/Masalas_&_Spices.png"},{name:"Atta, Rice and Pulses",imgSub:"https://www.grocamie.com/img/Atta_Rice_and_Pulses.png"}],img:"https://www.grocamie.com/img/category_grocery_and_staples.png"},{name:"Noodles, Sauces & Instant Food",subcategories:[{name:"Noodles and pasta",imgSub:"https://www.grocamie.com/img/Noodles_and_Pasta.png"},{name:"Soups and sauces",imgSub:"https://www.grocamie.com/img/Soups_and_sauces.png"},{name:"Instant food",imgSub:"https://www.grocamie.com/img/Instant_food.png"}],img:"https://www.grocamie.com/img/category_noodles_sauses_and_instant_foods.png"},{name:"Confectionery & Snacks",subcategories:[{name:"Sweets",imgSub:"https://www.grocamie.com/img/Sweets.png"}],img:"https://www.grocamie.com/img/category_confectionary_and_snacks.png"}]
