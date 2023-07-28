import Quality from "../models/Quality.js";
import Desp from "../models/Desp.js";
import Client from "../models/Client.js";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
applyPlugin(jsPDF);
import "jspdf-autotable";
// import autoTable from "jspdf-autotable";
import path from "path";
import { dirname } from "path";
import ejs from "ejs";
let contigency = 2.5,
  electrification = 2.5;

export const getAmt = async (req, res, next) => {
  const {
    customerName,
    address,
    plotLength,
    plotWidth,
    totalBuiltupArea,
    floors,
    projectType,
    constructionQuality,
    mobileNo,
    mailId,
  } = req.body;
  let qData, despdetails, conrate, eamt, tamt, camount, eamount;
  let estimatecalc = [];
  let desptable = [];
  let barea = parseInt(totalBuiltupArea);
  try {
    qData = await Quality.findOne({ name: constructionQuality });
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  } else {
    conrate = qData.rate;
    eamt = conrate * barea;
    camount = eamt * (contigency / 100);
    eamount = eamt * (electrification / 100);
    tamt = eamt + camount + eamount;
    try {
      despdetails = await Desp.find({ category: projectType });
    } catch (err) {
      console.log(err);
    }
    if (!despdetails) {
      return res.status(404).json({ message: "No Data Found" });
    } else {
      let sno = 0;
      estimatecalc = despdetails.map((el) => {
        sno += 1;
        let qtyc = (eamt * (el.percent / 100)) / el.rate;
        let amtc = eamt * (el.percent / 100);
        let row = {
          "sr.no": sno,
          desp: el.desp,
          qty: qtyc.toFixed(2),
          unit: el.unit,
          rate: el.rate.toFixed(2),
          amount: amtc.toFixed(2),
        };
        return row;
      });

      // desptable.push(estimatecalc)
      estimatecalc.push(
        {
          "sr.no": sno + 1,
          desp: `Add for Contengencies & Water Charges at ${contigency.toFixed(
            2
          )}%`,
          qty: "",
          unit: "",
          rate: "",
          amount: camount,
        },
        {
          "sr.no": sno + 2,
          desp: `Add for Electrification & Other Charges at ${electrification.toFixed(
            2
          )}%`,
          qty: "",
          unit: "",
          rate: "",
          amount: eamount,
        }
      );

      //  res.status(200).json({success:  true, data: estimatecalc})
      let userinput = [
        {
          name: customerName,
          add: address,
          length: plotLength,
          width: plotWidth,
          btarea: barea,
          floor: floors,
          prtype: projectType,
          conq: constructionQuality,
          mob: mobileNo,
          mail: mailId,
        },
      ];

      res.status(200).json({ success: true, data: estimatecalc });

      let edata = [];

      estimatecalc.forEach((element, index, array) => {
        edata.push([
          element["sr.no"],
          element.desp,
          element.qty,
          element.unit,
          element.rate,
          element.amount,
        ]);
      });
      console.log[edata];
      const doc = new jsPDF("p", "in", "a4");
      // doc.setFontSize(20);
      // doc.text("ESTIMATE", 2.5, 1.5);
      // doc.text("PROJECT", 2.5, 3.5);
      // doc.fromHTML("#section1", 0.5, 0.5);

      autoTable(doc, {
        head: [["SR.NO.", "DESCRIPTION", "QUANTITY", "UNIT", "RATE", "AMOUNT"]],
        body: edata,
      });
      doc.save("table.pdf");
    }
  }
};

function genPDF(data, name, add, area) {
  // <div id="section1" class="container mt-5">
  //   <div class="a4-page">
  //     <h1 class="text-center"></h1>
  //     <form>
  //       <div class="form-group">
  //         <strong>
  //           <label class="prjtitle text-center" for="projectTitle">
  //             ESTIMATE
  //           </label>
  //         </strong>
  //       </div>
  //       <div class="form-group">
  //         <label class="projectword text-center" for="projectTitle">
  //           PROJECT
  //         </label>
  //       </div>

  //       <div class="form-group">
  //         <label class="ptype text-center" for="projectTitle">
  //           {add}
  //         </label>
  //       </div>
  //       <div class="form-group">
  //         <label class="pin text-center" for="projectTitle">
  //           IN
  //         </label>
  //       </div>

  //       <div class="form-group">
  //         <label class="laddress text-center" for="projectTitle">
  //           {area}
  //         </label>
  //       </div>
  //       <div class="form-group">
  //         <label class="lof text-center" for="projectTitle">
  //           OF
  //         </label>
  //       </div>
  //       <div class="form-group">
  //         <label class="lname text-center" for="projectTitle">
  //           {name}
  //         </label>
  //       </div>
  //     </form>
  //   </div>
  // </div>;

  const doc = new jsPDF("p", "in", "a4");
  doc.setFontSize(20);
  doc.text("ESTIMATE", 2.5, 1.5);
  doc.text("PROJECT", 2.5, 3.5);
  doc.fromHTML("#section1", 0.5, 0.5);
  doc.save("sample.pdf");
}

const getRates = async (req, res, next) => {
  const constructionQuality = req.body.constructionQuality;
  let qData;
  try {
    qData = await Quality.findOne({ name: constructionQuality });
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData.rate });
};

export const getAllData = async (req, res, next) => {
  const {
    customerName,
    address,
    plotLength,
    plotWidth,
    totalBuiltupArea,
    floors,
    projectType,
    constructionQuality,
    mobileNo,
    mailId,
  } = req.body;
  let qData;
  try {
    qData = await Quality.find({});
  } catch (err) {
    console.log(err);
  }
  if (!qData) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: qData });
};
