import express from "express";

const estimaterouter = express.Router();


import { getAmt } from "../controllers/main-controller.js";



//Get Estimate Amt Data
estimaterouter.post("/", getAmt);


export default estimaterouter;
