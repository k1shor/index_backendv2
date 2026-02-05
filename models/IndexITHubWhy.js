const mongoose = require('mongoose')

const reasonsSchema = new mongoose.Schema({
    reason: {
        type: String,
        required: true
    },
    reason_image: {
        type: String
    }
},{timestamps: true})

module.exports = mongoose.model("Reasons", reasonsSchema)