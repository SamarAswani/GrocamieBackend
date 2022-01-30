const mongoose = require("mongoose");

const CategoriesSchema = mongoose.Schema({
    name: {
      type: String
    },
    subcategories: [{
        name: String,
        imgSub: String
    }],
    img: String

});

// export model user with UserSchema
module.exports = mongoose.model("categories", CategoriesSchema);


