const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Lod env variables
dotenv.config({path:"./config/config.env"});

// Load models
const Bootcamp = require("./models/Bootcamp");

// Connect to db
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

// Read JSON files
const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`,'UTF-8'));

// Import into db
const importData = async()=>{
  try{
    await Bootcamp.create(bootcamps);
    console.log(`Bootcamps imported ...`.green.inverse);
    process.exit();
  }catch(err){
    console.error(err);
  }
}

const deleteData = async()=>{
  try{
    await Bootcamp.deleteMany();
    console.log(`Bootcamps destroyed ...`.red.inverse);
    process.exit();
  }catch(err){
    console.error(err);
  }
}

if(process.argv[2] === "-i") importData();
else if(process.argv[2] === "-d") deleteData();