const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { ObjectId } = mongoose.Schema


const TokenSchema = new Schema({
    token: {
        type: String,
        // required: true
    },
    user: {
        type: ObjectId,
        ref: "User",
        // require: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 86400
    }
})

module.exports = mongoose.model("Token", TokenSchema)