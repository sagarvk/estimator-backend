import express from "express";

const ptyperouter = express.Router();

import { getAllData } from "../controllers/ptype-controller.js";
// Quality Model
// let qualitySchema = require("../models/Quality");

//Get Quality Data
ptyperouter.get("/", getAllData);

export default ptyperouter;
