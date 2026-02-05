const express = require('express')
require('dotenv').config()
require('./database/connection')
const cors = require('cors')
const morgan = require('morgan')

const userRoutes = require('./routes/UserRoutes')
const aboutRoutes = require('./routes/AboutRoutes')
const serviceRoutes = require("./routes/ServiceRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const reasonsRoutes = require('./routes/reasonRoutes');
const blogRoutes = require("./routes/blogRoutes");


const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))



app.use('/api/user', userRoutes)
app.use('/api/about', aboutRoutes)
app.use("/api/services", serviceRoutes);
app.use("/api/projects", projectRoutes);
app.use('/api/reasons', reasonsRoutes);
app.use("/api/blogs", blogRoutes);




const port = process.env.PORT






app.use('/api/public/uploads', express.static('public/uploads/'))

app.get('/',(req,res)=>res.send("SERVER is Running"))

app.listen(port,()=>console.log("SERVER STARTED SUCCESSFULLY", port))
