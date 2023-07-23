import express from "express";

const desprouter = express.Router();

import { getAllData } from "../controllers/desp-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

//Get Desp Data
desprouter.get("/", getAllData);


export default desprouter;
