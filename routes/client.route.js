import express from "express";

const clientrouter = express.Router();

import { addclient, getAllClient } from "../controllers/client-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

//Get Quality Data
clientrouter.get("/", getAllClient);
clientrouter.post("/addclient", addclient)

export default clientrouter;
