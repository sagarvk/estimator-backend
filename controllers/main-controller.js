import Quality from "../models/Quality.js";
import Desp from "../models/Desp.js";
import Client from "../models/Client.js";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import DOMPurify from "dompurify";
import autoTable from "jspdf-autotable";
import "jspdf-autotable";
// import autoTable from "jspdf-autotable";
import path from "path";
import { dirname } from "path";
import ejs from "ejs";
applyPlugin(jsPDF);

let contigency = 2.5,
  electrification = 2.5;

export const getAmt = async (req, res, next) => {
  const {
    customerName,
    address,
    plotLength,
    plotWidth,
    totalBuiltupArea,
    numOfFloors,
    projectType,
    constructionQuality,
    mobileNo,
    mailId,
  } = req.body;
  let qData, despdetails, conrate, eamt, tamt, camount, eamount;
  let estimatecalc = [];
  let desptable = [];
  let barea = parseInt(totalBuiltupArea);
  let bplotlength = parseInt(plotLength);
  let bplotwidht = parseInt(plotWidth);
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
          "sr.no": "",
          desp: `Add for Contengencies & Water Charges at ${contigency.toFixed(
            2
          )}%`,
          qty: "",
          unit: "",
          rate: "",
          amount: camount.toFixed(2),
        },
        {
          "sr.no": "",
          desp: `Add for Electrification & Other Charges at ${electrification.toFixed(
            2
          )}%`,
          qty: "",
          unit: "",
          rate: "",
          amount: eamount.toFixed(2),
        },
        {
          "sr.no": "",
          desp: `TOTAL`,
          qty: "",
          unit: "",
          rate: "",
          amount: tamt.toFixed(2),
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
          floor: numOfFloors,
          prtype: projectType,
          conq: constructionQuality,
          mob: mobileNo,
          mail: mailId,
        },
      ];

      res.status(200).json({ success: true, data: estimatecalc });

      let edata = [];
      let firmname = "VKON CONSULTANTS";
      let firmadd1 = "At : Nimgaon Korhale, Post : Laxmiwadi, Tal : Rahata,";
      let firmadd2 = "Ahmednagar - 423 109";
      let firmcontact =
        "Mob - +91- 9960 867 555, 9859 121 121 | Email - abc@gmail.com";

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
      let pgwidth = doc.internal.pageSize.getWidth();
      let pgheight = doc.internal.pageSize.getHeight();

      let est = `<html><div><u><b>ESTIMATE</b></u></div></html>`;

      // doc.html(est, {
      //   callback: function (doc) {
      //     // Save the PDF
      //     console.log(est);
      //   },
      //   x: pgwidth / 2,
      //   y: 1.5,
      //   width: 8.27, //target width in the PDF document
      //   windowWidth: 8.27, //window width in CSS pixels
      // });
      // doc.text("<u><b>ESTIMATE</b></u>", pgwidth / 2, 1.5, "center");
      doc.setFontSize(20);
      doc.setFont("Helvetica", "bold");
      doc.text("ESTIMATE", pgwidth / 2, 1.5, "center");
      doc.setFontSize(15);
      doc.setFont("Helvetica", "bold");
      doc.text("PROJECT", pgwidth / 2, 3.5, "center");
      doc.setFont("Helvetica", "normal");
      doc.text(
        "PROPOSED " + projectType.toUpperCase(),
        pgwidth / 2,
        4.25,
        "center"
      );
      doc.setFont("Helvetica", "bold");
      doc.text("IN", pgwidth / 2, 5, "center");
      doc.setFont("Helvetica", "normal");
      let splitadd = doc.splitTextToSize(address.toUpperCase(), 6);
      doc.text(splitadd, pgwidth / 2, 5.5, "center");
      doc.text("OF", pgwidth / 2, 7, "center");
      doc.setFont("Helvetica", "bold");
      doc.text(customerName.toUpperCase(), pgwidth / 2, 7.5, "center");
      doc.setFontSize(20);
      doc.setFont("Helvetica", "bold");
      doc.text(firmname.toUpperCase(), pgwidth / 2, 10.25, "center");
      doc.setFontSize(15);
      doc.setFont("Helvetica", "normal");
      doc.text(firmadd1.toUpperCase(), pgwidth / 2, 10.5, "center");
      doc.text(firmadd2.toUpperCase(), pgwidth / 2, 10.75, "center");
      doc.text(firmcontact.toUpperCase(), pgwidth / 2, 11.0, "center");
      doc.setLineWidth(0.0312);
      doc.rect(0.5, 0.5, pgwidth - 1, pgheight - 1, "S");
      doc.setLineWidth(0.0156);
      doc.rect(0.575, 0.575, pgwidth - 1.15, pgheight - 1.15, "S");

      doc.addPage();

      doc.setFontSize(15);
      doc.setFont("Helvetica", "bold");
      doc.line(0.5, 2.5, 7.75, 2.5);
      doc.text("ESTIMATE SUMMARY", pgwidth / 2, 2.8, "center");
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.line(0.5, 3, 7.75, 3);
      doc.text("NAME OF CLIENT", 0.75, 3.25);
      let splitcname = doc.splitTextToSize(customerName.toUpperCase(), 4);
      doc.text(splitcname, 3.25, 3.25);
      doc.line(0.5, 3.5, 7.75, 3.5);
      doc.text("ADDRESS", 0.75, 3.75);
      let splitaddress = doc.splitTextToSize(address.toUpperCase(), 4);
      doc.text(splitaddress, 3.25, 3.75);
      doc.line(0.5, 5.25, 7.75, 5.25);
      doc.text("PLOT DIMENTION", 0.75, 5.75);
      doc.text("L (Ft.)", 3.5, 5.5);
      let flen = bplotlength.toFixed(2);
      let splitlength = doc.splitTextToSize(flen, 1);
      doc.text(splitlength, 3.5, 6);
      doc.text("L (M)", 4.75, 5.5);
      let mlen = bplotlength / 3.28;
      mlen = mlen.toFixed(2);
      let splitmlen = doc.splitTextToSize(mlen, 1);
      doc.text(splitmlen, 4.75, 6);
      doc.text("W (Ft.)", 5.75, 5.5);
      let fwidth = bplotwidht.toFixed(2);
      let splitwidth = doc.splitTextToSize(fwidth, 1);
      doc.text(splitwidth, 5.75, 6);
      doc.text("W (M)", 6.75, 5.5);
      let mwid = bplotwidht / 3.28;
      mwid = mwid.toFixed(2);
      let splitmwid = doc.splitTextToSize(mwid, 1);
      doc.text(splitmwid, 6.75, 6);
      doc.line(3, 5.75, 7.75, 5.75);
      doc.line(4.25, 5.25, 4.25, 6.25);
      doc.line(5.5, 5.25, 5.5, 6.25);
      doc.line(6.5, 5.25, 6.5, 6.25);

      doc.line(0.5, 6.25, 7.75, 6.25);
      doc.text("TOTAL BULILTUP AREA", 0.75, 6.75);
      doc.text("SQ.FT.", 3.75, 6.5);
      let farea = barea.toFixed(2);
      let splitbarea = doc.splitTextToSize(farea, 1);
      doc.text(splitbarea, 3.75, 7);
      doc.line(5.25, 6.25, 5.25, 7.25);
      doc.text("SQ.M.", 6.25, 6.5);
      let marea = barea / 10.764;
      marea = marea.toFixed(3);
      let splitmarea = doc.splitTextToSize(marea, 1);

      doc.text(splitmarea, 6.25, 7);
      doc.line(3, 6.75, 7.75, 6.75);

      doc.line(0.5, 7.25, 7.75, 7.25);
      doc.text("NO. OF FLOORS", 0.75, 7.5);
      let floornum = String(numOfFloors);
      doc.text(floornum, 3.5, 7.5);
      doc.line(0.5, 7.75, 7.75, 7.75);

      doc.text("TOTAL ESTIMATE AMOUNT", 0.75, 8);
      doc.text(tamt.toFixed(2), 4.25, 8);
      doc.line(0.5, 8.25, 7.75, 8.25);
      doc.text("APPROXIMATE RATE PER SQ.FT.", 0.75, 8.5);
      let apprate = tamt / barea;
      apprate = apprate.toFixed(2);
      apprate = String(apprate);
      doc.text(apprate, 4.25, 8.5);
      doc.line(0.5, 8.75, 7.75, 8.75);

      doc.line(0.5, 2.5, 0.5, 8.75);
      doc.line(3, 3, 3, 7.75);
      doc.line(4, 7.75, 4, 8.75);

      doc.line(7.75, 2.5, 7.75, 8.75);

      doc.addPage();

      doc.autoTable({
        columnStyles: { 5: { halign: "right" } },
        head: [["SR.NO.", "DESCRIPTION", "QUANTITY", "UNIT", "RATE", "AMOUNT"]],
        body: edata,
        theme: "plain",
        headStyles: {
          lineWidth: 0.0104,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          lineWidth: 0.0104,
          lineColor: [0, 0, 0],
        },
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
