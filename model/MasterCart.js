const mongoose = require("mongoose");

const MasterCartSchema = mongoose.Schema({
    _id: {
      type: String,
      required: true
    },
    products: [{
        _productId: String,
        _manufacturerId: String,
        _sp: Number,
        quantity: Number
    }],
    total: {
      type: Number,
      default: 0
    }
});

// export model user with UserSchema
module.exports = mongoose.model("mastercart", MasterCartSchema);
