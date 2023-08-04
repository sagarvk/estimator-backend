import express from "express";

const ptyperouter = express.Router();

import { getAllData } from "../controllers/quality-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

//Get Quality Data
// qualityrouter.get("/", getAllData);

export default ptyperouter;
