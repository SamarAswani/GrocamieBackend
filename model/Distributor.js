const mongoose = require("mongoose");

const DistributorSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    deliveryDay: [{
      location: String,
      day: String
    }],
    username: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    profileUrl: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    manufacturer: {
        type: [String]
    },
    location: {
      type: String,
      required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

// export model user with UserSchema
module.exports = mongoose.model("distributor", DistributorSchema);
