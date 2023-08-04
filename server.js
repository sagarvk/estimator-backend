import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import qualityrouter from "./routes/quality.route.js";
import desprouter from "./routes/desp.route.js";
import clientrouter from "./routes/client.route.js";
import estimaterouter from "./routes/main.route.js";
import { getDbUrl } from './db/db.js'
import ptyperouter from "./routes/ptype.route.js";

// Express Route

// Connecting MongoDB Database
mongoose.Promise = global.Promise;
mongoose.connect(getDbUrl())
  .then(() => app.listen(process.env.PORT))
  .then(() => console.log('Database successfully connected!'))
  .catch(error => console.log('Could not connect to database : ', error))

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/quality", qualityrouter);
app.use("/desp", desprouter);
app.use("/client", clientrouter);
app.use("/estimate", estimaterouter);
