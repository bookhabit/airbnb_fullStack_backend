const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const app = express();

app.use(express.json())
app.use(cors())

console.log(process.env.MONGO_URL)
// 몽고 db password ff16ouQEJJcn82YP
mongoose.connect(process.env.MONGO_URL);

app.post('/register',(req,res)=>{
    const {name,email,password} = req.body;
    res.json({name,email,password})
})

app.listen(4000)