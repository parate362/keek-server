const express = require("express");
require("dotenv").config();
const cors = require("cors");
require("./src/db/conn");
const fs = require('fs');
const path = require('path')
const Router = express.Router()

const app = express();

app.use(express.json());

const allowedOrigins = ["http://localhost:5173","https://keek-client.vercel.app"];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

fs.readdirSync(path.join(__dirname,'/src/routes/')).forEach(function(fileName) {
  if(fileName === 'index.js' || fileName.substr(fileName.lastIndexOf('.')) !== 'js'){
      const name = fileName.substr(0,fileName.indexOf('.'))
      require('./src/routes/' + name)(app,Router)
  }
})




const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listen on port${port}`));