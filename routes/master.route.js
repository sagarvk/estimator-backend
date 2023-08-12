import express from "express";

const masterrouter = express.Router();

import { getAllData } from "../controllers/master-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

// Get Quality Data
masterrouter.get("/", getAllData);

export default masterrouter;
