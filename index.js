const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/User.js');
const Place = require('./models/Place.js')
const Booking = require('./models/Booking.js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const imageDownloader = require('image-downloader')
const multer = require('multer')
const fs = require('fs')

require('dotenv').config()
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';


app.use(express.json())
app.use(cookieParser());
app.use('/uploads/',express.static(__dirname+'/uploads'))
app.use(cors({credentials:true,origin:'http://localhost:5173'}));

function getUserDataFromReq(req){
  return new Promise((resolve,reject)=>{
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if(err) throw err;
      resolve(userData);
    })
  })
}

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

app.post('/login', async (req,res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign({
          email:userDoc.email,
          id:userDoc._id
        }, jwtSecret, {}, (err,token) => {
          if (err) throw err;
          res.cookie('token', token).json(userDoc);
        });
      } else {
        res.status(422).json('pass not ok');
      }
    } else {
      res.json('not found');
    }
  });

app.get('/profile', (req,res) => {
mongoose.connect(process.env.MONGO_URL);
const {token} = req.cookies;
if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const {name,email,_id} = await User.findById(userData.id);
    res.json({name,email,_id});
    });
} else {
    res.json(null);
}
});

app.post('/logout',(req,res)=>{
    res.cookie('token','').json(true);
})

// input string(이미지주소)으로 이미지업로드
app.post('/upload-by-link',async(req,res)=>{
    const {link} = req.body;
    const newName = 'photo'+ Date.now() + '.jpg'
    await imageDownloader.image({
      url:link,
      dest:__dirname+'/uploads/'+newName,
    })
    res.json(newName)
})

// input file로 파일업로드
const photosMiddleware = multer({dest:'uploads/'})
app.post('/upload',photosMiddleware.array('photos',100),(req,res)=>{
  const uploadFiles = [];
  for(let i=0;i<req.files.length;i++){
    const {path,originalname} = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length-1]
    const newPath = path +'.'+ext;
    fs.renameSync(path,newPath)
    uploadFiles.push(newPath.replace('uploads/',''));
  }
  res.json(uploadFiles);
})

// 숙소 등록
app.post('/places',(req,res)=>{
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  const {title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price
  } = req.body;
  console.log(addedPhotos)
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner:userData.id,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price
    })
    res.json({placeDoc,addedPhotos})
  });
})

// 숙소 수정
app.put('/places',async (req,res)=>{
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  const {id,
    title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price
  }=req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if(err) throw err;
    const placeDoc = await Place.findById(id)
    if(userData.id===placeDoc.owner.toString()){
      placeDoc.set({
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price
      })
      await placeDoc.save();
      res.json('ok')
    }
  });  
})

// 로그인 유저가 등록한 숙소리스트 찾기
app.get('/user-places', (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const {id} = userData;
    res.json( await Place.find({owner:id}) );
  });
});

// id값으로 숙소 찾기
app.get('/places/:id',async (req,res)=>{
  mongoose.connect(process.env.MONGO_URL);
  const {id} = req.params;
  res.json(await Place.findById(id))
})

// 메인페이지 숙소리스트 전체 찾기
app.get('/places',async (req,res)=>{
  mongoose.connect(process.env.MONGO_URL);
  res.json(await Place.find()) 
})

app.post('/bookings', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  const {
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
  } = req.body;
  Booking.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });
});

app.get('/bookings',async (req,res)=>{
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req)
  const bookingList = await Booking.find({user:userData.id}).populate('place')
  console.log(bookingList)
  res.json(bookingList)
})


app.listen(4000)