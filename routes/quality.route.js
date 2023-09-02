import express from "express";

const qualityrouter = express.Router();

import {
  getAllData,
  getAllDataFE,
  searchData,
} from "../controllers/quality-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

//Get Quality Data
qualityrouter.get("/", getAllDataFE);
qualityrouter.post("/search", searchData);

export default qualityrouter;
