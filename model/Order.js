const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
    _userId: {
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
    },
    timestamp: {
      type: String
    },
    active: {
      type: Boolean,
      default: true
    }
});

// export model user with UserSchema
module.exports = mongoose.model("orders", OrderSchema);
