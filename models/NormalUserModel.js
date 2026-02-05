const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NormalUserModel = new Schema({
    name: {
        type: String,
        // required: true,
        trim: true
    },
    email: {
        type: String,
        // required: true
    },
    message: {
        type: String,
        //required: true
    }
}, { timestamps: true })

module.exports = mongoose.model("NormalUser", NormalUserModel)