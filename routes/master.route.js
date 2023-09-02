import express from "express";

const masterrouter = express.Router();

import { getAllDataFE } from "../controllers/master-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

// Get Quality Data
masterrouter.post("/", getAllDataFE);

export default masterrouter;
