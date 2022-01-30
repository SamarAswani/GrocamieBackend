const mongoose = require("mongoose");

const CartSchema = mongoose.Schema({
    _id: {
      type: mongoose.ObjectId,
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
module.exports = mongoose.model("cart", CartSchema);

// Cart.prototype.isInCart = function(productId){
//   return mongoose.model("Cart").find()
//
// }
