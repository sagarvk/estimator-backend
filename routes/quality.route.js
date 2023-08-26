import express from "express";

const qualityrouter = express.Router();

import { getAllData, searchData } from "../controllers/quality-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

//Get Quality Data
qualityrouter.get("/", getAllData);
qualityrouter.post("/search", searchData);

export default qualityrouter;
