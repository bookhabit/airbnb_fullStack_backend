const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/User.js');
const bcrypt = require('bcryptjs')

require('dotenv').config()
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);

app.use(express.json())
app.use(cors({credentials:true,origin:'http://localhost:5173'}));

// 몽고 db password ff16ouQEJJcn82YP
mongoose.connect(process.env.MONGO_URL);
  
app.post('/register', async (req,res) => {
mongoose.connect(process.env.MONGO_URL);
    const {name,email,password} = req.body;
    try {
        const userDoc = await User.create({
        name,
        email,
        password:bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});

app.listen(4000)