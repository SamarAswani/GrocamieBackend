const mongoose = require("mongoose");

const CommunitySchema = mongoose.Schema({
    communityCode: {
        type: String
    },
    betaUsers: {
        type: [String]
    },
    name: {
        type: String,
        required: true
    },
    requests: {
        type: [String]
    },
    closingTime: {
        type: Date
    }
});

module.exports = mongoose.model("community", CommunitySchema);