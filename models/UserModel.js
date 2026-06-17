const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserModel = new Schema({
    firstname: {
        type: String,
        trim: true
    },
    lastname: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'others']
    },
    age: {
        type: Number,
    },
    phonenumber: {
        type: Number,
    },
    address: {
        tempAddress: [String],
        permanentAddress: {
            type: String,
        }
    },
    position: String,
    image: String,
    image_id: String,
    about: {
        type: String,
        trim: true
    },
    role: {
        type: Number, //0-normal user, 1-admin user, 2-super admin user
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.models.User ||mongoose.model("User", UserModel)