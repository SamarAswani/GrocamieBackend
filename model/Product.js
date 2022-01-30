const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema({
    _id: {
      type: mongoose.ObjectId,
      default: mongoose.Types.ObjectId(),
      auto: true
    },
    brand: {
        type: String
    },
    manufacturer: {
        type: String
    },
    gst: {
        type: Number
    },
    PriorityIndex: {
      type: Number
    },
    dealerPrice: {
        type: Number
    },
    margin: {
      type: String
    },
    marginP: {
      type: String
    },
    availability:{
      type: String
    },
    limit:{
      type: Number  
    },
    category: {
        type: String
    },
    subCategory: {
        type: String
    },
    description: {
        type: String
    },
    discount: {
        type: Number
    },
    imageUrl: {
        type: String
    },
    mrp: {
        type: Number
    },
    name: {
        type: String,
        required: true
    },
    productImageUrl: {
        type: String
    },
    sp: {
        type: Number
        // required: true
    },
    weight: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

// export model user with UserSchema
module.exports = mongoose.model("product", ProductSchema);
