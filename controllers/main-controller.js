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
      });

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

        const browser = await puppeteer.launch({
          headless: "true",
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

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
          path: `./files/raw/${randomreportname}.pdf`,
          format: "a4",
          displayHeaderFooter: false,
          printBackground: true,
          footerTemplate: footerTemplate,
          margin: { top: 100, bottom: 60 },
        });
        await page.setContent(htmlMarkupsummarypage);

        await page.pdf({
          path: `./files/raw/${randomsummaryname}.pdf`,
          format: "a4",
          printBackground: true,
        });
        await browser.close();

        ///////////using html-pdf

        // const imgdata = `PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1OTUuMyA4NDEuOSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmb250LXNpemU6MThweDtmb250LWZhbWlseTpNb250c2VycmF0LUJvbGQsIE1vbnRzZXJyYXQ7fS5jbHMtMSwuY2xzLTUsLmNscy02e2ZpbGw6IzFkMWQxYjt9LmNscy0xLC5jbHMtNXtmb250LXdlaWdodDo3MDA7fS5jbHMtMntmaWxsOiMzNmE5ZTE7fS5jbHMtM3tmaWxsOiMzMDM1NDE7fS5jbHMtNHtmaWxsOiNmZmY7fS5jbHMtNSwuY2xzLTZ7Zm9udC1zaXplOjlweDt9LmNscy01e2ZvbnQtZmFtaWx5Ok9wZW5TYW5zLUJvbGQsIE9wZW4gU2Fuczt9LmNscy02e2ZvbnQtZmFtaWx5Ok9wZW5TYW5zLVJlZ3VsYXIsIE9wZW4gU2Fuczt9LmNscy03e2ZpbGw6IzNjYTllMDt9LmNscy04e2ZpbGw6IzNiYTllMDt9LmNscy05e2ZpbGw6IzNkYTllMDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkxIIEVQPC90aXRsZT48dGV4dCBjbGFzcz0iY2xzLTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDc4LjcyIDYzLjc2KSI+RVNUSU1BVE9SUFJPIENPTlNVTFRBTlRTPC90ZXh0PjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMzYiIHk9IjEyMS4xNiIgd2lkdGg9IjUyMyIgaGVpZ2h0PSI0LjMyIi8+PHJlY3QgY2xhc3M9ImNscy0zIiB5PSI4MTYuNDciIHdpZHRoPSI1OTUuMyIgaGVpZ2h0PSIyNS4yIi8+PGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIxMjMuMzUiIGN5PSI1OTYuNDkiIHI9IjEwLjIzIi8+PHRleHQgY2xhc3M9ImNscy01IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MjIuMDYgNTcuMjMpIj5BaG1lZG5hZ2FyLCBNYWhhcmFzaHRyYTwvdGV4dD48dGV4dCBjbGFzcz0iY2xzLTYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ2NC4yOSA3MS4xOCkiPis5MSAtIDk4NTQgMTIxIDEyMTwvdGV4dD48dGV4dCBjbGFzcz0iY2xzLTYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5MC44OCA4NS40KSI+ZXN0aW1hdG9ycHJvY29uc3VsdGFudHNAZ21haWwuY29tPC90ZXh0Pjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI1NC41MyA2NS4wNiAzOC4zOCA1NS43MyAzOC4zOCA1MC4wOCA1NC41MyA1OS40IDU0LjUzIDY1LjA2Ii8+PHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjU0LjUzIDczLjQ0IDM4LjM4IDY0LjExIDM4LjM4IDU4LjQ1IDU0LjUzIDY3Ljc4IDU0LjUzIDczLjQ0Ii8+PHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjU0LjUzIDgxLjgxIDM4LjM4IDcyLjQ4IDM4LjM4IDY2LjgzIDU0LjUzIDc2LjE2IDU0LjUzIDgxLjgxIi8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNzAuNiw1NS43Myw1NC40NCw2NS4wNlY1OS40TDY1LDUzLjM0YzMuMTItMS44LDUuNjUtLjczLDUuNjUsMi4zOVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik02NSw2Ny4zNyw1NC40NCw3My40M1Y2Ny43OEw3MC42LDU4LjQ1aDBDNzAuNiw2MS41OCw2OC4wNyw2NS41Nyw2NSw2Ny4zN1oiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iNzAuNjkgNDcuOCA1NC41MyA1Ny4xMiAzOC4yOSA0Ny44IDU0LjUzIDM4LjQ3IDcwLjY5IDQ3LjgiLz48cmVjdCBjbGFzcz0iY2xzLTMiIHg9IjMwNS4wNCIgeT0iMTIxLjE2IiB3aWR0aD0iMjUzLjk2IiBoZWlnaHQ9IjQuMzIiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik01NTkuMzYsODUuNDF2Mi40aC0xMC44Vjc3aDEwLjh2Mi40NGwtLjEtLjMtMy4xOSwzLjI2LDMuMTksMy4yNlpNNTQ5LjE0LDc4LjdsMCwwLC4xLjA3LDMuMzksMy4zOC42Ny42NmExLDEsMCwwLDAsLjU1LjMsMSwxLDAsMCwwLC44NC0uMzFsMS0xLDMtMywuMS0uMWEyLjg3LDIuODcsMCwwLDAtLjQ2LS4wN2gtOC43OUEzLjExLDMuMTEsMCwwLDAsNTQ5LjE0LDc4LjdabTMuMjksNC4xNS0uMDYsMC0zLjIxLDMuMjhhMS40LDEuNCwwLDAsMCwuMzIuMDZoOC44OGExLDEsMCwwLDAsLjQ2LS4xbC0zLjMtMy4yN2E3LjI4LDcuMjgsMCwwLDEtLjUzLjU3LDEuNTQsMS41NCwwLDAsMS0yLDBBNi44OSw2Ljg5LDAsMCwxLDU1Mi40Myw4Mi44NVptLTMuNzMtMy42OC0uMDUsMGExLjgsMS44LDAsMCwwLS4wNi4zMnEwLDIuOTEsMCw1LjgyYTEuOTEsMS45MSwwLDAsMCwuMDYuMzNoLjA1bDMuMTgtMy4yNVoiLz48cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik01NTkuMzYsODUuNDFsLS4xLjI2LTMuMTktMy4yNiwzLjE5LTMuMjYuMS4zWiIvPjxwYXRoIGNsYXNzPSJjbHMtOCIgZD0iTTU0OS4xNCw3OC43YTMuMTEsMy4xMSwwLDAsMSwuNDQtLjA2aDguNzlhMi44NywyLjg3LDAsMCwxLC40Ni4wN2wtLjEuMS0zLDMtMSwxYTEsMSwwLDAsMS0uODQuMzEsMSwxLDAsMCwxLS41NS0uM2wtLjY3LS42Ni0zLjM5LTMuMzgtLjEtLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtNyIgZD0iTTU1Mi40Myw4Mi44NWE2Ljg5LDYuODksMCwwLDAsLjUyLjU2LDEuNTQsMS41NCwwLDAsMCwyLDAsNy4yOCw3LjI4LDAsMCwwLC41My0uNTdsMy4zLDMuMjdhMSwxLDAsMCwxLS40Ni4xaC04Ljg4YTEuNCwxLjQsMCwwLDEtLjMyLS4wNmwzLjIxLTMuMjhaIi8+PHBhdGggY2xhc3M9ImNscy03IiBkPSJNNTQ4LjcsNzkuMTdsMy4xOCwzLjI1LTMuMTgsMy4yNWgtLjA1YTEuOTEsMS45MSwwLDAsMS0uMDYtLjMzcTAtMi45MSwwLTUuODJhMS44LDEuOCwwLDAsMSwuMDYtLjMyWiIvPjxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTU1MC44NSw2My4xMmg4LjUxdjguNTZhMCwwLDAsMCwxLDAsMCwxLjEzLDEuMTMsMCwwLDAtLjM5LS43NmMtLjQ1LS40My0uODgtLjg2LTEuMzEtMS4zMWExLjA5LDEuMDksMCwwLDAtMS0uMzUuODguODgsMCwwLDAtLjcxLjU5LDEuMDcsMS4wNywwLDAsMS0xLC43NCwxLjUsMS41LDAsMCwxLS42OC0uMjEsNC44Myw0LjgzLDAsMCwxLTEuNDMtMS4xMUEzLjkxLDMuOTEsMCwwLDEsNTUyLDY3LjlhMSwxLDAsMCwxLDAtLjY4LDEuMDksMS4wOSwwLDAsMSwuNzEtLjY4Ljg2Ljg2LDAsMCwwLC40Ni0uMzgsMSwxLDAsMCwwLS4xNy0xLjI4Yy0uNDgtLjQ4LS45NS0xLTEuNDQtMS40M2EyLDIsMCwwLDAtLjM5LS4yNkExLDEsMCwwLDAsNTUwLjg1LDYzLjEyWiIvPjxwYXRoIGNsYXNzPSJjbHMtNyIgZD0iTTU1MC44NSw2My4xMmExLDEsMCwwLDEsLjI0LjA3LDIsMiwwLDAsMSwuMzkuMjZjLjQ5LjQ3LDEsMSwxLjQ0LDEuNDNhMSwxLDAsMCwxLC4xNywxLjI4Ljg2Ljg2LDAsMCwxLS40Ni4zOCwxLjA5LDEuMDksMCwwLDAtLjcxLjY4LDEsMSwwLDAsMCwwLC42OCwzLjkxLDMuOTEsMCwwLDAsLjg1LDEuMzUsNC44Myw0LjgzLDAsMCwwLDEuNDMsMS4xMSwxLjUsMS41LDAsMCwwLC42OC4yMSwxLjA3LDEuMDcsMCwwLDAsMS0uNzQuODguODgsMCwwLDEsLjcxLS41OSwxLjA5LDEuMDksMCwwLDEsMSwuMzVjLjQzLjQ1Ljg2Ljg4LDEuMzEsMS4zMWExLjEzLDEuMTMsMCwwLDEsLjM5Ljc2LDAsMCwwLDAsMCwwLDB2LjEzczAsLjA3LDAsLjFhMSwxLDAsMCwxLS4yOS42Yy0uMzIuMzMtLjY1LjY1LTEsMWExLjM3LDEuMzcsMCwwLDEtLjQ4LjMxLDIuMzMsMi4zMywwLDAsMS0xLjMxLDAsNi4xLDYuMSwwLDAsMS0xLjY2LS42NSwxMi42OCwxMi42OCwwLDAsMS0yLjIyLTEuNTYsMTYuMDgsMTYuMDgsMCwwLDEtMS44MS0xLjg4LDkuODUsOS44NSwwLDAsMS0xLjc4LTMsMy4xNiwzLjE2LDAsMCwxLS4yLTEuNCwxLjQ1LDEuNDUsMCwwLDEsLjM5LS44OGMuMzItLjMzLjY1LS42NiwxLTFhLjk0Ljk0LDAsMCwxLC40Ni0uMjdsLjA3LDBaIi8+PHBhdGggY2xhc3M9ImNscy00IiBkPSJNNTUwLjUsNjMuMTJsLS4wNywwYS45NC45NCwwLDAsMC0uNDYuMjdjLS4zMy4zMi0uNjYuNjUtMSwxYTEuNDUsMS40NSwwLDAsMC0uMzkuODgsMy4xNiwzLjE2LDAsMCwwLC4yLDEuNCw5Ljg1LDkuODUsMCwwLDAsMS43OCwzLDE2LjA4LDE2LjA4LDAsMCwwLDEuODEsMS44OCwxMi42OCwxMi42OCwwLDAsMCwyLjIyLDEuNTYsNi4xLDYuMSwwLDAsMCwxLjY2LjY1LDIuMzMsMi4zMywwLDAsMCwxLjMxLDAsMS4zNywxLjM3LDAsMCwwLC40OC0uMzFjLjMyLS4zMi42NS0uNjQsMS0xYTEsMSwwLDAsMCwuMjktLjZzMC0uMDcsMC0uMXYyLjExaC0xMC44VjYzLjEyWiIvPjxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTU0OC41NiwxMDEuNzFWOTAuOTFoMTAuOHYxMC44Wm00LjI3LS40OGgwYy0uMTItLjE0LS4yNC0uMjYtLjM1LS40YTUuNTEsNS41MSwwLDAsMS0uODUtMS44bC0uMTctLjY4aC0yLjExbDAsLjA5YTUsNSwwLDAsMCwzLDIuNjZabTAtOS44MmgtLjFhNS4wOCw1LjA4LDAsMCwwLTMuMzMsMi43NWwwLC4xMmgyLjExbDAtLjFhNS40MSw1LjQxLDAsMCwxLDEuMzQtMi43OGgwWm0yLjI4LDkuODIuMTEsMGE1LDUsMCwwLDAsMy4xOS0yLjQ4Yy4wNi0uMTIuMTItLjI1LjE5LS4zOGgtMi4xMmwwLC4xYTUuNDEsNS40MSwwLDAsMS0xLjM0LDIuNzhoMFptLjc5LTMuNTdhOS40Miw5LjQyLDAsMCwwLDAtMi42OEg1NTJhOS4wNiw5LjA2LDAsMCwwLDAsMi42OFptLS4xMy0zLjM3YTAsMCwwLDAsMSwwLDAsNiw2LDAsMCwwLS42My0xLjcsMi4xNSwyLjE1LDAsMCwwLS43Ni0uODUuNzYuNzYsMCwwLDAtLjgzLDAsMi4yNywyLjI3LDAsMCwwLS40Ny40MSwzLjksMy45LDAsMCwwLS43LDEuMzRjLS4wOS4yNy0uMTYuNTQtLjI0LjgyWm0tMy42MSw0LjA2YTUuNDgsNS40OCwwLDAsMCwuNywxLjg0LDIuMSwyLjEsMCwwLDAsLjY3LjcyLjc3Ljc3LDAsMCwwLC44NywwLDIuMTEsMi4xMSwwLDAsMCwuNDUtLjM5LDQsNCwwLDAsMCwuNy0xLjMzYy4wOS0uMjcuMTYtLjU1LjI0LS44M1ptLS44LTMuMzdoLTIuMTljLS4wNywwLS4wOCwwLS4wOS4wOWE0Ljg2LDQuODYsMCwwLDAsMCwyLjUxYzAsLjA4LDAsLjEuMTIuMWgyLjE2QTExLDExLDAsMCwxLDU1MS4zNiw5NVptNS4yMiwyLjY4aDIuMTljLjA3LDAsLjA4LDAsLjA5LS4wOWE1LDUsMCwwLDAsMC0yLjUxLjExLjExLDAsMCwwLS4xMy0uMWgtMi4xNkExMSwxMSwwLDAsMSw1NTYuNTgsOTcuNjZabS0xLjQ0LTYuMjV2MGwuMDcuMDhhNS4yOCw1LjI4LDAsMCwxLC4zNi40NCw2LjEsNi4xLDAsMCwxLC44OSwyLjI1YzAsLjA4LDAsLjEuMTMuMWgyYTUuMDcsNS4wNywwLDAsMC0zLjQ1LTIuODhaIi8+PHBhdGggY2xhc3M9ImNscy04IiBkPSJNNTU1LjksOTcuNjZoLTMuODVBOS4wNiw5LjA2LDAsMCwxLDU1Miw5NWgzLjg1QTkuNDIsOS40MiwwLDAsMSw1NTUuOSw5Ny42NloiLz48cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik01NTUuNzcsOTQuMjloLTMuNjJjLjA4LS4yOC4xNS0uNTUuMjQtLjgyYTMuOSwzLjksMCwwLDEsLjctMS4zNCwyLjI3LDIuMjcsMCwwLDEsLjQ3LS40MS43Ni43NiwwLDAsMSwuODMsMCwyLjE1LDIuMTUsMCwwLDEsLjc2Ljg1LDYsNiwwLDAsMSwuNjMsMS43QTAsMCwwLDAsMCw1NTUuNzcsOTQuMjlaIi8+PHBhdGggY2xhc3M9ImNscy03IiBkPSJNNTUyLjE2LDk4LjM1aDMuNjNjLS4wOC4yOC0uMTUuNTYtLjI0LjgzYTQsNCwwLDAsMS0uNywxLjMzLDIuMTEsMi4xMSwwLDAsMS0uNDUuMzkuNzcuNzcsMCwwLDEtLjg3LDAsMi4xLDIuMSwwLDAsMS0uNjctLjcyQTUuNDgsNS40OCwwLDAsMSw1NTIuMTYsOTguMzVaIi8+PHBhdGggY2xhc3M9ImNscy03IiBkPSJNNTUxLjM2LDk1YTExLDExLDAsMCwwLDAsMi42OUg1NDkuMmMtLjA3LDAtLjExLDAtLjEyLS4xYTQuODYsNC44NiwwLDAsMSwwLTIuNTFjMC0uMDYsMC0uMDkuMDktLjA5aDIuMTlaIi8+PHBhdGggY2xhc3M9ImNscy03IiBkPSJNNTU2LjU4LDk3LjY2YTExLDExLDAsMCwwLDAtMi42OWgyLjE2YS4xMS4xMSwwLDAsMSwuMTMuMSw1LDUsMCwwLDEsMCwyLjUxYzAsLjA2LDAsLjA5LS4wOS4wOWgtMi4xOVoiLz48cGF0aCBjbGFzcz0iY2xzLTkiIGQ9Ik01NTUuMTEsMTAxLjIzYTUuNDEsNS40MSwwLDAsMCwxLjM0LTIuNzhsMC0uMWgyLjEyYy0uMDcuMTMtLjEzLjI2LS4xOS4zOGE1LDUsMCwwLDEtMy4xOSwyLjQ4bC0uMTEsMFoiLz48cGF0aCBjbGFzcz0iY2xzLTkiIGQ9Ik01NTIuODMsOTEuNDFhNS40MSw1LjQxLDAsMCwwLTEuMzQsMi43OGwwLC4xaC0yLjExbDAtLjEyYTUuMDgsNS4wOCwwLDAsMSwzLjMzLTIuNzVaIi8+PHBhdGggY2xhc3M9ImNscy05IiBkPSJNNTU1LjE0LDkxLjQxYTUuMDcsNS4wNywwLDAsMSwzLjQ1LDIuODhoLTJjLS4wOCwwLS4xMSwwLS4xMy0uMWE2LjEsNi4xLDAsMCwwLS44OS0yLjI1LDUuMjgsNS4yOCwwLDAsMC0uMzYtLjQ0bC0uMDctLjA4WiIvPjxwYXRoIGNsYXNzPSJjbHMtOSIgZD0iTTU1Mi44MywxMDEuMjNsLS40OS0uMTNhNSw1LDAsMCwxLTMtMi42NmwwLS4wOWgyLjExbC4xNy42OGE1LjUxLDUuNTEsMCwwLDAsLjg1LDEuOGMuMTEuMTQuMjMuMjYuMzUuNFoiLz48cG9seWdvbiBjbGFzcz0iY2xzLTkiIHBvaW50cz0iNTUyLjgzIDkxLjQxIDU1Mi44NCA5MS40MSA1NTIuODMgOTEuNDEgNTUyLjgzIDkxLjQxIi8+PHBvbHlnb24gY2xhc3M9ImNscy05IiBwb2ludHM9IjU1Mi44MyAxMDEuMjMgNTUyLjg0IDEwMS4yMyA1NTIuODMgMTAxLjIzIDU1Mi44MyAxMDEuMjMiLz48cG9seWdvbiBjbGFzcz0iY2xzLTkiIHBvaW50cz0iNTU1LjExIDEwMS4yMyA1NTUuMSAxMDEuMjMgNTU1LjExIDEwMS4yMyA1NTUuMTEgMTAxLjIzIi8+PHRleHQgY2xhc3M9ImNscy02IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0NTcuMjkgOTkuNDYpIj53d3cuZXN0aW1hdG9yLmNvbTwvdGV4dD48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik01NTkuNTEsNTloLTEwLjhWNDguMTloMTAuOFptLTUuNjctMTAuNDVoMGwtLjM2LDAtLjM3LjA4YTMuNzEsMy43MSwwLDAsMC0yLjUsMi4zNCwzLjE1LDMuMTUsMCwwLDAtLjE4Ljg1LDIuNzMsMi43MywwLDAsMCwwLC45LDcuNzEsNy43MSwwLDAsMCwuNzIsMS43OSwyNS4yOCwyNS4yOCwwLDAsMCwyLDMuMDZjLjIxLjI5LjQ0LjU3LjY2Ljg2YS4zMi4zMiwwLDAsMCwuNDMuMTQuNTUuNTUsMCwwLDAsLjE4LS4xNmMuNDMtLjU5Ljg4LTEuMTcsMS4zLTEuNzdhMTYuMjEsMTYuMjEsMCwwLDAsMS43NC0zLjA2LDMuNTMsMy41MywwLDAsMCwuMzQtMS42NCw0LjUyLDQuNTIsMCwwLDAtLjI0LTEuMDksMy42NSwzLjY1LDAsMCwwLTEuMTktMS41OCwzLjMzLDMuMzMsMCwwLDAtMS4xMy0uNiw1LjM3LDUuMzcsMCwwLDAtLjgtLjE1QTQuMTIsNC4xMiwwLDAsMCw1NTMuODQsNDguNTRaIi8+PHBhdGggY2xhc3M9ImNscy03IiBkPSJNNTUzLjg0LDQ4LjU0YTQuMTIsNC4xMiwwLDAsMSwuNjEsMCw1LjM3LDUuMzcsMCwwLDEsLjguMTUsMy4zMywzLjMzLDAsMCwxLDEuMTMuNiwzLjY1LDMuNjUsMCwwLDEsMS4xOSwxLjU4LDQuNTIsNC41MiwwLDAsMSwuMjQsMS4wOSwzLjUzLDMuNTMsMCwwLDEtLjM0LDEuNjQsMTYuMjEsMTYuMjEsMCwwLDEtMS43NCwzLjA2Yy0uNDIuNi0uODcsMS4xOC0xLjMsMS43N2EuNTUuNTUsMCwwLDEtLjE4LjE2LjMyLjMyLDAsMCwxLS40My0uMTRjLS4yMi0uMjktLjQ1LS41Ny0uNjYtLjg2YTI1LjI4LDI1LjI4LDAsMCwxLTItMy4wNiw3LjcxLDcuNzEsMCwwLDEtLjcyLTEuNzksMi43MywyLjczLDAsMCwxLDAtLjksMy4xNSwzLjE1LDAsMCwxLC4xOC0uODUsMy43MSwzLjcxLDAsMCwxLDIuNS0yLjM0bC4zNy0uMDguMzYsMFptLjI1LDQuN2ExLjMzLDEuMzMsMCwwLDAsMS4zNy0xLjMyLDEuMzIsMS4zMiwwLDAsMC0xLjMzLTEuMzcsMS4zNSwxLjM1LDAsMCwwLDAsMi42OVoiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik01NTQuMDksNTMuMjRhMS4zNSwxLjM1LDAsMCwxLDAtMi42OSwxLjMyLDEuMzIsMCwwLDEsMS4zMywxLjM3QTEuMzMsMS4zMywwLDAsMSw1NTQuMDksNTMuMjRaIi8+PC9zdmc+`;
        // var options = {
        //   format: "A4",
        //   margin: {
        //     top: "0.5in",
        //     right: "0.5in",
        //     bottom: "0.5in",
        //     left: "0.5in",
        //   },

        //   header: {
        //     height: "100mm",
        //     contents: `<img src="./LH.svg"></img>`,
        //   },
        // };
        // const htmlMarkupsummarypage2 = render(summarypage2, {
        //   name: customerName.toUpperCase(),
        //   add: address.toUpperCase(),
        //   lenft: parseInt(plotLength).toFixed(2),
        //   lenmt: (plotLength / 3.28).toFixed(2),
        //   widft: parseInt(plotWidth).toFixed(2),
        //   widmt: (plotWidth / 3.28).toFixed(2),
        //   areasqft: barea.toFixed(2),
        //   areasqmt: (barea / 10.764).toFixed(2),
        //   floors: parseInt(numOfFloors).toFixed(2),
        //   totalamt: tamt.toFixed(2),
        //   ratepersqft: (tamt / barea).toFixed(2),
        //   firmname: firmname.toUpperCase(),
        //   tdate: todaydate,
        //   imgdata: imgdata,
        // });

        // pdf
        //   .create(htmlMarkupsummarypage2, options)
        //   .toFile("./estimate.pdf", function (err, res) {
        //     if (err) return console.log(err);
        //     console.log(res);
        //   });

        ////////////////////////
      })().then(() => {
        ///pdf-merger-js
        let merger = new PDFMerger();
        (async () => {
          await merger.add(`./files/raw/${randomsummaryname}.pdf`); //merge all pages. parameter is the path to file and filename.
          await merger.add(`./files/raw/${randomreportname}.pdf`); //merge all pages. parameter is the path to file and filename.
          await merger.save(`./files/raw/${randommergedfile}.pdf`); //save under given name and reset the internal document
          // Export the merged PDF as a nodejs Buffer
          // const mergedPdfBuffer = await merger.saveAsBuffer();
          // fs.writeSync('merged.pdf', mergedPdfBuffer);

          // ///Merge PDF using pdf-lib
          // var pdfBuffer1 = await fs.readFileSync(
          //   `./files/raw/${randomsummaryname}.pdf`
          // );
          // var pdfBuffer2 = await fs.readFileSync(
          //   `./files/raw/${randomreportname}.pdf`
          // );

          // var pdfsToMerge = [pdfBuffer1, pdfBuffer2];

          // const mergedPdf = await PDFDocument.create();
          // for (const pdfBytes of pdfsToMerge) {
          //   const pdf = await PDFDocument.load(pdfBytes);
          //   const copiedPages = await mergedPdf.copyPages(
          //     pdf,
          //     pdf.getPageIndices()
          //   );
          //   copiedPages.forEach((page) => {
          //     mergedPdf.addPage(page);
          //   });
          // }
          // const buf = await mergedPdf.save(); // Uint8Array
          // let fpath = `./files/${customerName}.pdf`;
          // fs.writeFileSync(fpath, await mergedPdf.save());
          ///////////////////////

          //////////////

          //Add Page Numbers
          const content = await PDFDocument.load(
            fs.readFileSync(`./files/raw/${randommergedfile}.pdf`)
          );
          // Add a font to the doc
          const helveticaFont = await content.embedFont(
            StandardFonts.Helvetica
          );
          // Draw a number at the bottom of each page.
          // Note that the bottom of the page is `y = 0`, not the top
          const pages = await content.getPages();
          let pagecount = pages.length;

          for (const [i, page] of Object.entries(pages)) {
            page.drawText(`Page ${+i + 1} of ${pagecount}`, {
              x: page.getWidth() - 100,
              y: 30,
              size: 12,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
          }
          // Write the PDF to a file
          fs.writeFileSync(`./files/${finalPDF}.pdf`, await content.save());
          /////////////////

          /////////////

          // fs.open(fpath, "w", function (err, fd) {
          //   fs.write(fd, buf, 0, buf.length, null, function (err) {
          //     fs.close(fd, function () {
          //       console.log("wrote the file successfully");
          //     });
          //   });
          // });
        })().then(() => {
          let filepath = path.resolve(__dirname, `../files/${finalPDF}.pdf`);

          fs.readFile(filepath, (err, file) => {
            if (err) {
              console.log(err);
              res.status(500).json({ success: false, message: "Error" });
            }

            // res.setHeader("Content-Type", "application/pdf");
            // res.setHeader(
            //   "Content-Disposition",
            //   `attachment; filename=${customerName}.pdf`
            // );
            // res.status(200).json({ success: true, data: filepath });
            // res.sendFile(filepath, {
            //   headers: { "Content-Type": "application/pdf" },
            // });
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

            ////Delete files

            try {
              unlinkSync(`./files/raw/${randomreportname}.pdf`);
              unlinkSync(`./files/raw/${randomsummaryname}.pdf`);
              unlinkSync(`./files/raw/${randommergedfile}.pdf`);
              // unlinkSync(`./files/${finalPDF}.pdf`);
              console.log(`successfully deleted `);
            } catch (error) {
              console.error("there was an error:", error.message);
            }

            /////////
          });
        });
      });

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
      // res.sendfile();
      // fs.readFile(path);

      // res.status(200).json({ success: true, data: estimatecalc });
      // res.sendFile(__dirname + "/merged final.pdf");
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
