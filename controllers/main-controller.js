import Quality from "../models/Quality.js";
import Desp from "../models/Desp.js";
import Client from "../models/Client.js";
// import { jsPDF } from "jspdf";
// import { applyPlugin } from "jspdf-autotable";
// import DOMPurify from "dompurify";
// import autoTable from "jspdf-autotable";
import ejs from "ejs";
import pdf from "html-pdf";
import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { render } from "ejs";
// import "jspdf-autotable";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import PDFMerger from "pdf-merger-js";
import pdfMerge from "pdf-merge";
import fs from "fs";
import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString,
  StandardFonts,
  rgb,
} from "pdf-lib";
import fileUrl from "file-url";
import { Console } from "console";
// applyPlugin(jsPDF);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
          srNo: sno,
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
          srNo: "",
          desp: `Add for Contengencies & Water Charges at ${contigency.toFixed(
            2
          )}%`,
          qty: "",
          unit: "",
          rate: "",
          amount: camount.toFixed(2),
        },
        {
          srNo: "",
          desp: `Add for Electrification & Other Charges at ${electrification.toFixed(
            2
          )}%`,
          qty: "",
          unit: "",
          rate: "",
          amount: eamount.toFixed(2),
        },
        {
          srNo: "",
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
      let firmname = process.env.FIRM_NAME;
      let firmadd1 = process.env.FIRM_ADD1;
      let firmadd2 = process.env.FIRM_ADD2;
      let firmcontact = process.env.FIRM_CONTACT;
      estimatecalc.forEach((element, index, array) => {
        edata.push([
          element.srNo,
          element.desp,
          element.qty,
          element.unit,
          element.rate,
          element.amount,
        ]);
      });
      console.log[edata];

      const template = ` `;

      var options = {
        format: "A4",
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
      };
      const htmlMarkup = ejs.render(template, {
        data: edata,
      });

      // pdf
      //   .create(htmlMarkup, options)
      //   .toFile("./estimate.pdf", function (err, res) {
      //     if (err) return console.log(err);
      //     console.log(res);
      //   });

      (async () => {
        const detailpage = readFileSync("./views/detailpage.html", {
          encoding: "utf-8",
        });
        const summarypage = readFileSync("./views/summarypage.html", {
          encoding: "utf-8",
        });

        let todaydate = new Date();
        let dd = String(todaydate.getDate()).padStart(2, "0");
        let mm = String(todaydate.getMonth() + 1).padStart(2, "0"); //January is 0!
        let yyyy = todaydate.getFullYear();

        todaydate = mm + "." + dd + "." + yyyy;

        const htmlMarkupdetailpage = render(detailpage, {
          edata,
          firmname: firmname,
          tdate: todaydate,
        });
        const htmlMarkupsummarypage = render(summarypage, {
          name: customerName.toUpperCase(),
          add: address.toUpperCase(),
          lenft: parseInt(plotLength).toFixed(2),
          lenmt: (plotLength / 3.28).toFixed(2),
          widft: parseInt(plotWidth).toFixed(2),
          widmt: (plotWidth / 3.28).toFixed(2),
          areasqft: barea.toFixed(2),
          areasqmt: (barea / 10.764).toFixed(2),
          floors: parseInt(numOfFloors).toFixed(2),
          totalamt: tamt.toFixed(2),
          ratepersqft: (tamt / barea).toFixed(2),
        });

        const browser = await puppeteer.launch({ headless: "true" });
        const page = await browser.newPage();

        await page.setContent(htmlMarkupdetailpage);

        const footerTemplate = `
        <p style="align:right; margin: auto;font-size: 12px;">
          Page <span class="pageNumber">pageNumber+1</span>
            of 
          <span class="totalPages">{$ }totalPages+1</span>
          </p>
        `;
        let img = `<img src="../stamp.png" width="160" height="150" style="float: right;vertical-align:right;margin:200px 50px">`;
        await page.pdf({
          path: "report.pdf",
          format: "a4",
          displayHeaderFooter: true,
          printBackground: true,
          footerTemplate: footerTemplate,
          margin: { top: 100, bottom: 60 },
        });
        await page.setContent(htmlMarkupsummarypage);

        await page.pdf({
          path: "summary.pdf",
          format: "a4",
        });

        await browser.close();
      })().then(() => {
        ///pdf-merger-js

        let merger = new PDFMerger();
        (async () => {
          await merger.add("summary.pdf"); //merge all pages. parameter is the path to file and filename.
          await merger.add("report.pdf"); //merge all pages. parameter is the path to file and filename.
          await merger.save("merged.pdf"); //save under given name and reset the internal document
          // Export the merged PDF as a nodejs Buffer
          // const mergedPdfBuffer = await merger.saveAsBuffer();
          // fs.writeSync('merged.pdf', mergedPdfBuffer);
        })();

        ///////
      });

      // ///pdf-lib

      (async () => {
        var pdfBuffer1 = await fs.readFileSync("./summary.pdf");
        var pdfBuffer2 = await fs.readFileSync("./report.pdf");

        var pdfsToMerge = [pdfBuffer1, pdfBuffer2];

        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of pdfsToMerge) {
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
          );
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        }

        const buf = await mergedPdf.save(); // Uint8Array

        let path = "merged final.pdf";
        fs.open(path, "w", function (err, fd) {
          fs.write(fd, buf, 0, buf.length, null, function (err) {
            fs.close(fd, function () {
              console.log("wrote the file successfully");
            });
          });
        });
      })();
      // .then(() => {
      //   (async () => {
      //     const pdfData = fs.readFileSync("./mergeds.pdf");

      //     // const arrayBuffer = await fetch(pdfData).then((res) =>
      //     //   res.arrayBuffer()
      //     // );
      //     const content = await PDFDocument.load(pdfData);
      //     // Add a font to the doc
      //     const helveticaFont = await content.embedFont(
      //       StandardFonts.Helvetica
      //     );
      //     // Draw a number at the bottom of each page.
      //     // Note that the bottom of the page is `y = 0`, not the top
      //     const pages = await content.getPages();
      //     for (const [i, page] of Object.entries(pages)) {
      //       page.drawText(`Page ${+i + 1} of ${pages}`, {
      //         x: page.getWidth() / 2,
      //         y: 10,
      //         size: 15,
      //         font: helveticaFont,
      //         color: rgb(0, 0, 0),
      //       })();
      //     }
      //     let pathpdf = "merged final with no.pdf";
      //     fs.open(pathpdf, "w", function (err, fd) {
      //       fs.write(fd, content, 0, content.length, null, function (err) {
      //         fs.close(fd, function () {
      //           console.log("wrote the file successfully");
      //         });
      //       });
      //     });
      //   })();
      //   /////////////
      // });

      //////
    }
  }
};

function genPDF(data, name, add, area) {
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
