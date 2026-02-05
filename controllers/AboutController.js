const About = require('../models/AboutModel')
const fs = require('fs')

// add About 
exports.addAboutSection = async (req,res) => {
    console.log(req.body)
    if(!req.file){
        return res.status(400).json({error:"Image is required"})
    }
    let about = await About.create({
        description: req.body.description,
        image: req.file.path
    })
    if(!about){
        return res.status(400).json({error:"Something went wrong"})
    }
    res.send({success: true})
}

// get about section
exports.getAbout = async (req, res) => {
    let about = await About.findOne()
    if(!about){
        return res.status(400).json({error:"Something went wrong"})
    }
    res.send(about)
}

// update about
exports.updateAbout = async (req, res) => {
    let about = await About.findOne()
    about.description = req.body.description
    if(req.file){
        if(fs.existsSync(about.image)){
            fs.unlinkSync(about.image)
        }
        about.image = req.file.path
    }
    about = await about.save()
    if(!about){
        return res.status(400).json({error:"Something went wrong"})
    }
    res.send(about)
}

// delete about
exports.deleteAbout = async (req, res) => {
  try {
    const data = await About.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: "About section not found" });

    if (data.image && fs.existsSync(data.image)) fs.unlinkSync(data.image);
    return res.json({ success: true, message: "About deleted" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

