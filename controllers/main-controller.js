import quality from "../models/Quality.js";
import Desp from "../models/Desp.js";
import Client from "../models/Client.js";
import Master from "../models/Master.js";
import { jsPDF } from "jspdf";
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
import { unlinkSync } from "fs";
import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString,
  StandardFonts,
  rgb,
} from "pdf-lib";
import crypto from "crypto";
import fileUrl from "file-url";
import { Console } from "console";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";
import PdfMake from "pdfmake";
import Stripe from "stripe";
const stripe = new Stripe(
  "sk_test_51NrhvoSJukRFIJnJIpuzjyVHKrpdvUa8KDj1au6zOjNctKOh0Ed2uRQBB7D3PPFaAkV7POla3LN1aZAyHqrPW2Wk00020PxI80"
);
// applyPlugin(jsPDF);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let contigency = 2.5,
  electrification = 2.5;

export const getPdf = async (req, res, next) => {
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
    orderId,
    payId,
  } = req.body;

  let qData, mData, despdetails, conrate, eamt, tamt, camount, eamount;
  let estimatecalc = [];
  let desptable = [];
  let barea = parseInt(totalBuiltupArea);
  let bplotlength = parseInt(plotLength);
  let bplotwidht = parseInt(plotWidth);
  try {
    qData = await quality.find({
      $and: [
        { name: { $regex: constructionQuality } },
        { ptype: { $regex: projectType } },
      ],
    });
  } catch (err) {
    console.log(err);
  }
  if (!qData || !qData.length) {
    return res.status(404).json({ message: "No Data Found" });
  } else {
    conrate = qData[0].rate;
    console.log(conrate);
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

      let edata = [];
      let columns = [];
      let columnValue = [];
      let detailedBody = [];
      let cRow = new Array();

      cRow.push({
        text: "SR.NO.",
        style: "header",
        colSpan: 1,
        borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
        alignment: "center",
      });
      cRow.push({
        text: "DESCRIPTION",
        style: "header",
        colSpan: 1,
        borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
        alignment: "center",
      });
      cRow.push({
        text: "QTY",
        style: "header",
        colSpan: 1,
        borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
        alignment: "center",
      });
      cRow.push({
        text: "UNIT",
        style: "header",
        colSpan: 1,
        borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
        alignment: "center",
      });
      cRow.push({
        text: "RATE",
        style: "header",
        colSpan: 1,
        borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
        alignment: "center",
      });
      cRow.push({
        text: "AMOUNT",
        style: "header",
        colSpan: 1,
        borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
        alignment: "center",
      });

      columnValue.push(cRow);
      // console.log(columns);

      try {
        mData = await Master.find({});
      } catch (err) {
        console.log(err);
      }

      let firmname = mData[0].companyname;
      let firmadd1 = mData[0].add1;
      let firmadd2 = mData[0].add2;
      let firmcontact = mData[0].contact;
      let charges = mData[0].charges;
      let randomreportname = `report_${customerName}_${getRandomFileName()}`;
      let randomsummaryname = `summary_${customerName}_${getRandomFileName()}`;
      let randommergedfile = `merged_${customerName}_${getRandomFileName()}`;
      let finalPDF = `${customerName}_${getRandomFileName()}`;
      estimatecalc.forEach((element, index, array) => {
        edata.push([
          element.srNo,
          element.desp,
          element.qty,
          element.unit,
          element.rate,
          element.amount,
        ]);

        let row = new Array();
        if (element.unit != "") {
          row.push({
            text: element.srNo,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "center",
            style: "header",
          });
          row.push({
            text: element.desp,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "justify",
            style: "details",
          });
          row.push({
            text: element.qty,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "left",
            style: "details",
          });
          row.push({
            text: element.unit,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "left",
            style: "details",
          });
          row.push({
            text: element.rate,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "left",
            style: "details",
          });
          row.push({
            text: element.amount,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "right",
            style: "details",
          });
        } else {
          row.push({
            text: element.srNo,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "center",
            style: "header",
          });
          row.push({
            text: element.desp,
            colSpan: 4,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "justify",
            style: "header",
          });
          row.push({});
          row.push({});
          row.push({});
          row.push({
            text: element.amount,
            colSpan: 1,
            borderColor: ["#cccccc", "#cccccc", "#cccccc", "#cccccc"],
            alignment: "right",
            style: "header",
          });
        }
        columnValue.push(row);
      });

      detailedBody.push(columnValue);

      const template = ` `;

      let totalrows = 30;
      const htmlMarkup = ejs.render(template, {
        data: edata,
        totalrows,
      });

      (async () => {
        const detailpage = readFileSync("./views/detailpage.html", {
          encoding: "utf-8",
        });
        const summarypage = readFileSync("./views/summarypage.html", {
          encoding: "utf-8",
        });
        const summarypage2 = readFileSync("./views/summarypage html-pdf.html", {
          encoding: "utf-8",
        });

        let todaydate = new Date();
        let dd = String(todaydate.getDate()).padStart(2, "0");
        let mm = String(todaydate.getMonth() + 1).padStart(2, "0"); //January is 0!
        let yyyy = todaydate.getFullYear();

        todaydate = dd + "." + mm + "." + yyyy;
        let lrow = edata.length;

        const htmlMarkupdetailpage = render(detailpage, {
          edata,
          firmname: firmname.toUpperCase(),
          tdate: todaydate,
          lrow: lrow,
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
          firmname: firmname.toUpperCase(),
          tdate: todaydate,
        });

        //////USING PUPPETEER END
        // const browser = await puppeteer.launch({
        //   headless: "true",
        //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
        // });

        // const page = await browser.newPage();

        // await page.setContent(htmlMarkupdetailpage);

        // const footerTemplate = `
        // <p style="align:right; margin: auto;font-size: 12px;">
        //   Page <span class="pageNumber">pageNumber+1</span>
        //     of
        //   <span class="totalPages">{$ }totalPages+1</span>
        //   </p>
        // `;
        // let img = `<img src="../stamp.png" width="160" height="150" style="float: right;vertical-align:right;margin:200px 50px">`;
        // await page.pdf({
        //   path: `./files/raw/${randomreportname}.pdf`,
        //   format: "a4",
        //   displayHeaderFooter: false,
        //   printBackground: true,
        //   footerTemplate: footerTemplate,
        //   margin: { top: 100, bottom: 60 },
        // });
        // await page.setContent(htmlMarkupsummarypage);

        // await page.pdf({
        //   path: `./files/raw/${randomsummaryname}.pdf`,
        //   format: "a4",
        //   printBackground: true,
        // });
        // await browser.close();
        //////USING PUPPETEER END

        //USING PDFmake
        let fonts = {
          Roboto: {
            normal: "./fonts/Roboto-Regular.ttf",
            bold: "./fonts/Roboto-Bold.ttf",
            italics: "./fonts/Roboto-Italic.ttf",
            bolditalics: "./fonts/Roboto-BoldItalic.ttf",
          },
        };
        // 1 mm = 2.835 pt 1 in = approx. 71.729 pt

        let pdfmake = new PdfMake(fonts);
        let docDefination = {
          pageSize: "A4",
          pageMargins: [35.864, 35.864, 35.864, 53.79675],
          background: function (page) {
            if (page === 1) {
              return [
                {
                  image: "letterhead",
                  width: 593.198,
                  alignment: "center",
                  position: "absolute",
                },
                {
                  image: "sealsign",
                  width: 120,
                  margin: [450, -125, 0, 0],
                },
                {
                  image: "checkmark",
                  width: 30,
                  margin: [10, -15, 60, 50],
                },
              ];
            } else {
              return [
                {
                  image: "sealsign",
                  width: 120,
                  margin: [450, 710, 0, 0],
                },
                {
                  image: "checkmark",
                  width: 30,
                  margin: [10, -15, 60, 50],
                },
              ];
            }
          },
          footer: function (currentPage, pageCount) {
            return [
              {
                columns: [
                  {
                    text:
                      "Digitally Signed by : " +
                      firmname.toUpperCase() +
                      "\nReason : ESIGN\nDate : " +
                      todaydate,
                    alignment: "left",
                    margin: [40, 2, 20, 50],
                    fontSize: 8,
                    bold: "true",
                  },
                  {
                    text: "Page " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    margin: [5, 2, 20, 20],
                  },
                ],
              },
            ];
          },
          content: [
            {
              columns: [
                {
                  text: "REF. NO. ",
                  fontSize: 12,
                  bold: "true",
                  margin: [0, 95, 35.864, 5],
                },
                {
                  text: "DATE: " + todaydate,
                  fontSize: 12,
                  bold: "true",
                  alignment: "right",
                  margin: [10, 95, 0, 5],
                },
              ],
            },
            {
              text: "ESTIMATE SUMMARY",
              fontSize: 18,
              bold: true,
              alignment: "center",
              margin: [35.864, 20, 35.864, 5],
            },
            {
              style: "tableExample",
              table: {
                headerRows: 1,
                heights: 35,
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    {
                      text: "NAME OF CLIENT",
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `${customerName.toUpperCase()}`,
                      colSpan: 4,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {},
                    {},
                  ],
                  [
                    {
                      text: "ADDRESS",
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `${address.toUpperCase()}`,
                      colSpan: 4,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {},
                    {},
                  ],
                  [
                    {
                      text: "PLOT DIMENSION",
                      colSpan: 1,
                      rowSpan: 2,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `L (Ft.)`,
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `L (M)`,
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `W (Ft.)`,
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `W (M)`,
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                  ],
                  [
                    {},

                    {
                      text: parseInt(plotLength).toFixed(2),
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: (plotLength / 3.28).toFixed(2),
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: parseInt(plotWidth).toFixed(2),
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: (plotWidth / 3.28).toFixed(2),
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                  ],
                  [
                    {
                      text: "TOTAL BUILTUP AREA",
                      colSpan: 1,
                      rowSpan: 2,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: `SQ.FT.`,
                      colSpan: 2,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {
                      text: `SQ.M.`,
                      colSpan: 2,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                  ],
                  [
                    {},
                    {
                      text: barea.toFixed(2),
                      colSpan: 2,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {
                      text: (barea / 10.764).toFixed(2),
                      colSpan: 2,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                  ],
                  [
                    {
                      text: "NO. OF FLOORS",
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: parseInt(numOfFloors).toFixed(2),
                      colSpan: 4,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {},
                    {},
                  ],
                  [
                    {
                      text: "ESTIMATE AMOUNT",
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: tamt.toFixed(2),
                      colSpan: 4,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {},
                    {},
                  ],
                  [
                    {
                      text: "APPROXIMATE RATE PER SQ.FT.",
                      colSpan: 1,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {
                      text: (tamt / barea).toFixed(2),
                      colSpan: 4,
                      borderColor: ["#000000"],
                      alignment: "center",
                    },
                    {},
                    {},
                    {},
                  ],
                ],
              },
            },
            {
              text: "ABSTRACT SHEET",
              fontSize: 18,
              bold: true,
              alignment: "center",
              pageBreak: "before",
            },
            {
              style: "tableDetails",
              table: {
                widths: ["auto", "*", "auto", "auto", "auto", "auto"],
                headerRows: 1,
                body: columnValue,
              },
            },
          ],
          styles: {
            tableExample: {
              margin: [0, 5, 0, 15],
              fontSize: 15,
              bold: true,
            },
            tableDetails: {
              margin: [0, 5, 0, 15],
            },
            header: {
              fontSize: 12,
              bold: true,
            },
            details: {
              fontSize: 12,
              bold: false,
            },
          },
          images: {
            checkmark:
              "data:image/png;base64,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",
            sealsign:
              "data:image/png;base64,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",
            letterhead:
              "data:image/png;base64,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ACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAGuYMdwAAIABJREFUAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAACAjYgMAAAAAAAAAeLFrxwIAAAAAg/yth7GnOAJgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAgNi1YwEAAACAQf7Ww9hTHLGR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ1HO4q3AAAgAElEQVQAAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4mN2LVjAQAAAIBB/tbD2FMcAQAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAZA7N3vURxXFsbhg8vfYSMARSAyMBuB2QiEMsAZsBnIERhFsFIERhEYIjBEsEME42rpsoVW2uVf97x3up+nagr4dvv0VPHlV+cCAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiOEOCe0AACAASURBVA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAAAAAAECNiAwAAAAAAAAAAIEbEBgAAAAAAAAAAQIyIDQAAAAAAAAAAgBgRGwAAAAAAAAAAADEiNgAAAAAAAAAAAGJEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAIgRsQEAAAAAAAAAABAjYgMAAAAAAAAAACBGxAYAAAAAAAAAAECMiA0AAAAAAAAAAIAYERsAAAAAAAAAAAAxIjYAAAAAAAAAAABiRGwAAAAAAAAAAADEiNgAAAAAAAAAAACIEbEBAAAAAAAAAAAQI2IDAAAAAAAAAAAgRsQGAAAAAAAAAABAjIgNAAAAAAAAAACAGBEbAAAAAAAAAAAAMSI2AAAAAAAAAAAAYkRsAAAAAAAAAAAAxIjYAAAAAAAAAAAAiBGxAQAAAAAA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AABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAA3wjDhQAAIABJREFUAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AABi144FAAAAAAb5Ww9jT3EEAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbiQ0AAAAAAAAAAICNxAYAAAAAAAAAAMBGYgMAAAAAAAAAAGAjsQEAAAAAAAAAALCR2AAAAAAAAAAAANhIbAAAAAAAAAAAAGwkNgAAAAAAAAAAADYSGwAAAAAAAAAAABuJDQAAAAAAAAAAgI3EBgAAAAAAAAAAwEZiAwAAAAAAAAAAYCOxAQAAAAAAAAAAsJHYAAAAAAAAAAAA2EhsAAAAAAAAAAAAbCQ2AAAAAAAAAAAANhIbAAAAAAAAAAAAG4kNAAAAAAAAAACAjcQGAAAAAAAAAADARmIDAAAAAAAAAABgI7EBAAAAAAAAAACwkdgAAAAAAAAAAADYSGwAAAAAAAAAAABsJDYAAAAAAAAAAAA2EhsAAAC1dwc1EEJREAQfCYI4cd7gDGVYwcnHxfalSsKcOxkAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAICMiA0AAAAAAAAAAIDMdpzXz/wAAAAAAAAAAAAE3n1mHssDAAAAAAAAAAAQuN2JAgAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAACZO7kkAAAAwElEQVQAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkBGxAQAAAAAAAAAAkNnWWtYHAAAAAAAAAADg/2bmAxcX8z78FycUAAAAAElFTkSuQmCC",
          },
        };

        let pdfDoc;
        pdfDoc = pdfmake.createPdfKitDocument(docDefination, {});
        let writeStream = fs.createWriteStream(`./files/${finalPDF}.pdf`);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        writeStream.on("finish", function () {
          // do stuff here that need to be after the pdf write is completed

          // sending to frontend
          // sending as attachment

          let filepath = path.resolve(__dirname, `../files/${finalPDF}.pdf`);

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=${customerName}.pdf`
          );
          res.sendFile(filepath);
          ///Sendmail
          sendMail(
            customerName,
            mobileNo,
            mailId,
            orderId,
            payId,
            address,
            charges,
            filepath
          );

          // ////Delete files
          // try {
          //   // unlinkSync(`./files/raw/${randomreportname}.pdf`);
          //   // unlinkSync(`./files/raw/${randomsummaryname}.pdf`);
          //   // unlinkSync(`./files/raw/${randommergedfile}.pdf`);
          //   // unlinkSync(`./files/${finalPDF}.pdf`);
          //   console.log(`successfully deleted `);
          // } catch (error) {
          //   console.error("there was an error:", error.message);
          // }
        });

        /////////
      })().then(() => {
        // let filepath = path.resolve(__dirname, `../files/${finalPDF}.pdf`);
        // res.setHeader("Content-Type", "application/pdf");
        // res.setHeader(
        //   "Content-Disposition",
        //   `attachment; filename=${customerName}.pdf`
        // );
        // res.sendFile(filepath);
        // ///Sendmail
        // sendMail(
        //   customerName,
        //   mobileNo,
        //   mailId,
        //   orderId,
        //   payId,
        //   address,
        //   charges,
        //   filepath
        // );
        // ////Delete files
        // try {
        //   // unlinkSync(`./files/raw/${randomreportname}.pdf`);
        //   // unlinkSync(`./files/raw/${randomsummaryname}.pdf`);
        //   // unlinkSync(`./files/raw/${randommergedfile}.pdf`);
        //   // unlinkSync(`./files/${finalPDF}.pdf`);
        //   console.log(`successfully deleted `);
        // } catch (error) {
        //   console.error("there was an error:", error.message);
        // }
        // /////////
      });

      // .then(() => {
      ///pdf-merger-js
      // let merger = new PDFMerger();
      // async () => {
      //   await merger.add(`./files/raw/${randomsummaryname}.pdf`); //merge all pages. parameter is the path to file and filename.
      //   await merger.add(`./files/raw/${randomreportname}.pdf`); //merge all pages. parameter is the path to file and filename.
      //   await merger.save(`./files/raw/${randommergedfile}.pdf`); //save under given name and reset the internal document
      //   //////////////
      //   //Add Page Numbers
      //   const content = await PDFDocument.load(
      //     fs.readFileSync(`./files/raw/${randommergedfile}.pdf`)
      //   );
      //   // Add a font to the doc
      //   const helveticaFont = await content.embedFont(
      //     StandardFonts.Helvetica
      //   );
      //   // Draw a number at the bottom of each page.
      //   // Note that the bottom of the page is `y = 0`, not the top
      //   const pages = await content.getPages();
      //   let pagecount = pages.length;
      //   for (const [i, page] of Object.entries(pages)) {
      //     page.drawText(`Page ${+i + 1} of ${pagecount}`, {
      //       x: page.getWidth() - 100,
      //       y: 30,
      //       size: 12,
      //       font: helveticaFont,
      //       color: rgb(0, 0, 0),
      //     });
      //   }
      //   // Write the PDF to a file
      //   fs.writeFileSync(`./files/${finalPDF}.pdf`, await content.save());
      //   /////////////////
      //   /////////////
      // })().then(() => {
      // let filepath = path.resolve(__dirname, `../files/${finalPDF}.pdf`);
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader(
      //   "Content-Disposition",
      //   `attachment; filename=${customerName}.pdf`
      // );
      // res.sendFile(filepath);
      // ///Sendmail
      // sendMail(
      //   customerName,
      //   mobileNo,
      //   mailId,
      //   orderId,
      //   payId,
      //   address,
      //   charges,
      //   filepath
      // );
      ////Delete files
      // try {
      //   // unlinkSync(`./files/raw/${randomreportname}.pdf`);
      //   // unlinkSync(`./files/raw/${randomsummaryname}.pdf`);
      //   // unlinkSync(`./files/raw/${randommergedfile}.pdf`);
      //   unlinkSync(`./files/${finalPDF}.pdf`);
      //   console.log(`successfully deleted `);
      // } catch (error) {
      //   console.error("there was an error:", error.message);
      // }
      //     /////////
      //   });
      //   });
      // };
    }
  }
};

export const getEAmt = async (req, res, next) => {
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
  // { $regex: constructionQuality }
  // { $regex: projectType }
  try {
    qData = await quality.find({
      $and: [
        { name: { $regex: constructionQuality } },
        { ptype: { $regex: projectType } },
      ],
    });
  } catch (err) {
    console.log(err);
  }
  if (!qData || !qData.length) {
    return res.status(404).json({ message: "No Data Found" });
  } else {
    conrate = qData[0].rate;
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

      res
        .status(200)
        .json({ success: true, data: estimatecalc, amtData: tamt });
    }
  }
};

function sendMail(
  customerName,
  mobileNo,
  emailId,
  orderId,
  payId,
  address,
  amtPaid,
  filepath
) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASS,
    },
  });

  let message = {
    from: "estimatorproconsultants@gmail.com",
    to: emailId,
    subject: "Thankyou for Purchase!!!",
    text: "",
    html: `<!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @media screen and (max-width: 600px) {
                .container {
                    width: 100% !important;
                }
            }
    
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: #f2f2f2;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
    
            .header {
                background-color: #007bff;
                color: white;
                text-align: center;
                padding: 20px;
                border-radius: 5px 5px 0 0;
            }
    
            .table-container {
                margin-top: 20px;
            }
    
            table {
                width: 100%;
                border-collapse: collapse;
            }
    
            th, td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
    
            th {
                background-color: #f2f2f2;
            }
    
            .footer {
                margin-top: 20px;
                padding: 10px;
                text-align: center;
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">Thank You for Estimate Purchase</h1>
                <p style="margin-top: 10px;">We appreciate your business!</p>
            </div>
            <div class="table-container">
                <table>
                    <tr>
                        <th>Client Name</th>
                        <td>${customerName}</td>
                    </tr>
                    <tr>
                        <th>Address</th>
                        <td>${address}</td>
                    </tr>
                    <tr>
                        <th>Amount Paid</th>
                        <td>${amtPaid}</td>
                    </tr>
                    <tr>
                        <th>Order ID</th>
                        <td>${orderId}</td>
                    </tr>
                    <tr>
                        <th>Payment ID</th>
                        <td>${payId}</td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>${emailId}</td>
                    </tr>
                    <tr>
                        <th>Mobile No.</th>
                        <td>${mobileNo}</td>
                    </tr>
                </table>
            </div>
            <div class="footer">
                <p>For any inquiries, please contact us at <a href="mailto:contact@example.com">contact@example.com</a>.</p>
            </div>
        </div>
    </body>
    </html>
    `,
    attachments: [
      {
        // file on disk as an attachment
        filename: `${customerName}.pdf`,
        path: filepath, // stream this file
      },
    ],
  };

  transporter.sendMail(message);
}

function getRandomFileName() {
  var timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  var random = ("" + Math.random()).substring(2, 8);
  var random_number = timestamp + random;
  return random_number;
}

export const genpayOrder = async (req, res, next) => {
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
  let mData;
  try {
    mData = await Master.find({});
  } catch (err) {
    console.log(err);
  }
  let keyid = mData[0].keyid;
  let keysecret = mData[0].keysecret;
  // let keyid = process.env.KEY_ID;
  // let keysecret = process.env.KEY_SECRET;
  let payamt = mData[0].charges;

  let instance = new Razorpay({
    key_id: keyid,
    key_secret: keysecret,
  });

  let options = {
    amount: payamt * 100, // amount in the smallest currency unit
    currency: "INR",
    // receipt: "order_rcptid_11",
  };
  instance.orders.create(options, function (err, order) {
    if (err) {
      return res.send({ code: 500, message: "Sever Err" });
    }
    return res.send({ code: 200, message: "order created", data: order });
  });
};

export const stripeCheckout = async (req, res, next) => {
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
  let mData;
  try {
    mData = await Master.find({});
  } catch (err) {
    console.log(err);
  }
  let keyid = mData[0].keyid;
  let keysecret = mData[0].keysecret;
  // let keyid = process.env.KEY_ID;
  // let keysecret = process.env.KEY_SECRET;
  let payamt = mData[0].charges;
  const session = await stripe.checkout.sessions.create({
    customer_email: mailId,
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price_data: {
          currency: "inr",
          product_data: {
            name: "Construction Estimate",
          },
          unit_amount: payamt * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:3000/success`,
    cancel_url: `http://localhost:3000/failure`,
  });

  res.json({ id: session.id });

  // res.status(200).json({ success: true, data: session.id, id: session.id });
};
export const payVerify = async (req, res, next) => {
  let body =
    req.body.response.razorpay_order_id +
    "|" +
    req.body.response.razorpay_payment_id;

  let mData;
  try {
    mData = await Master.find({});
  } catch (err) {
    console.log(err);
  }
  let keyid = mData[0].keyid;
  let keysecret = mData[0].keysecret;
  // let keyid = process.env.KEY_ID;
  // let keysecret = process.env.KEY_SECRET;
  let payamt = mData[0].charges;

  var expectedSignature = crypto
    .createHmac("sha256", keysecret)
    .update(body.toString())
    .digest(`hex`);
  if (expectedSignature === req.body.response.razorpay_signature) {
    res.send({ code: 200, message: "Valid Sign" });
  } else {
    res.send({ code: 500, message: "Invalid Sign" });
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

function genPdfmake() {}

export const contactUs = async (req, res, next) => {
  const { name, email, mailmessage } = req.body;

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASS,
    },
  });

  let message = {
    from: "estimatorproconsultants@gmail.com",
    to: "estimatorproconsultants@gmail.com",
    subject: `Contact Us Response by - ${name}`,
    text: "",
    html: ` <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
    
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
    
      .customer-data {
        margin-bottom: 20px;
      }
    
      .label {
        font-weight: bold;
        margin-bottom: 5px;
      }
    
      .value {
        margin-bottom: 15px;
      }
    
      @media screen and (max-width: 600px) {
        .container {
          padding: 10px;
        }
      }
    </style>
    </head>
    <body>
      <div class="container">
        <h2>Contact Information</h2>
        <div class="customer-data">
          <span class="label">Customer Name:</span>
          <span class="value">${name}</span>
        </div>
        <div class="customer-data">
          <span class="label">Email ID:</span>
          <span class="value">j${email}</span>
        </div>
        <div class="customer-data">
          <span class="label">Message:</span>
          <p class="value">${mailmessage}</p>
        </div>
      </div>
    </body>
    </html>
     `,
  };

  let mailed = transporter.sendMail(message);
  if (!mailed) {
    return res.status(404).json({ message: "No Data Found" });
  }
  return res.status(200).json({ success: true, data: mailed });
};

const getRates = async (req, res, next) => {
  const constructionQuality = req.body.constructionQuality;
  let qData;
  try {
    qData = await Quality.findOne({
      name: constructionQuality,
      pname: projectType,
    });
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
