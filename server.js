import express from "express";
import mongoose from "mongoose";
import cors from "cors";
// import dotenv from .env;
import bodyParser from "body-parser";
import qualityrouter from "./routes/quality.route.js";
import desprouter from "./routes/desp.route.js";
import clientrouter from "./routes/client.route.js";
import estimaterouter from "./routes/main.route.js";



// Express Route

// Connecting MongoDB Database
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/estimator").then(() => app.listen(4000)).then(()=>{
console.log('Database successfully connected!')
},
error => {
	console.log('Could not connect to database : ' + error)
})

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
extended: true
}));
app.use(cors());
app.use("/quality",qualityrouter);
app.use("/desp",desprouter);
app.use("/client",clientrouter);
app.use("/estimate",estimaterouter);

// app.get("/", async(req,res)=>{
// res.json({message : "Server Runing..."})
// })
// PORT
// const port = process.env.PORT || 4000;
// const server = app.listen(port, () => {
// console.log('Connected to port ' + port)
// })

// // 404 Error
// app.use(async(req, res, next) => {
// res.status(404).send('Error 404!')
// });

// app.use(function (err, req, res, next) {
// console.error(err.message);
// if (!err.statusCode) err.statusCode = 500;
// res.status(err.statusCode).send(err.message);
// });
