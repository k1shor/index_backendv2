const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CareerModel = new Schema({
    career_title: {
        type: String,
        required: true,
        trim: true
    },
    vacancyNumber: {
        type: Number,
        trim: true
    },
    offered_salary: {
        type: Number,
    },
    job_description: {
        type: String,
        trim: true
    },
    qualification: {
        type: String,
    },
    posted_date: {
        type: Date,
    },
    deadline: {
        type: Date,
    },
    location: {
        type: String,
        default: "Remote"
    },
    type: { type: String, enum: ["full-time", "part-time", "remote"], default: "full-time" },


}, { timestamps: true })

module.exports = mongoose.model("Career", CareerModel)



