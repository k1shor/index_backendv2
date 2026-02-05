const mongoose =require("mongoose")

const AboutSchema = mongoose.Schema({
    description: {
        type: String,
        requried: true
    },
    image: {
        type:String,
        requried: true
    }
}, {timestamps: true})

module.exports = mongoose.model("About", AboutSchema)