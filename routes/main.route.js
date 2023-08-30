import express from "express";

const estimaterouter = express.Router();

import {
  getPdf,
  getEAmt,
  genpayOrder,
  payVerify,
  contactUs,
} from "../controllers/main-controller.js";

//Get Estimate PDF Data
estimaterouter.post("/", getPdf);
//Get Estimate Estimate Amount Data
estimaterouter.post("/eamt", getEAmt);
//Generate Payment Order
estimaterouter.post("/createorder", genpayOrder);
//Generate Payment Order
estimaterouter.post("/payverify", payVerify);
//Send Contact Us Form
estimaterouter.post("/contactus", contactUs);

export default estimaterouter;
