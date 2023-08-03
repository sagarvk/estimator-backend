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
      let firmname = "VKON CONSULTANTS";
      let firmadd1 = "At : Nimgaon Korhale, Post : Laxmiwadi, Tal : Rahata,";
      let firmadd2 = "Ahmednagar - 423 109";
      let firmcontact =
        "Mob - +91- 9960 867 555, 9859 121 121 | Email - abc@gmail.com";

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

      // var pdfBuffer1 = await fs.readFileSync("./summary.pdf");
      // var pdfBuffer2 = await fs.readFileSync("./report.pdf");

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

      // let path = "merged final.pdf";
      // fs.open(path, "w", function (err, fd) {
      //   fs.write(fd, buf, 0, buf.length, null, function (err) {
      //     fs.close(fd, function () {
      //       console.log("wrote the file successfully");
      //     });
      //   });
      // });

      // /////////

      // (async () => {
      //   try {
      //     // Load the PDF file you want to sign
      //     const pdfPath = path.join(__dirname, "../mergeds.pdf");
      //     const pdfBytes = fs.readFileSync(pdfPath);
      //     console.log(pdfPath);

      //     // Load your private key (you will need to replace 'private-key.pfx' with your actual private key file)
      //     const privateKeyPath = path.join(__dirname, "../keys/cert.p12");
      //     const privateKeyPassword = "1234"; // Replace with your private key password
      //     const privateKeyBytes = fs.readFileSync(privateKeyPath);
      //     console.log(privateKeyBytes);
      //     // Load the PDF document

      //     const pdfDoc = await PDFDocument.load(pdfBytes);
      //     const DEFAULT_BYTE_RANGE_PLACEHOLDER = "**********";
      //     const SIGNATURE_LENGTH = 3322;

      //     const page = pdfDoc.getPages()[0]; // Assume the signature is on the first page
      //     const pages = pdfDoc.getPages(); // Assume the signature is on the first page

      //     // Create a new signature
      //     const signatureDict = pdfDoc.context.obj({
      //       Type: PDFName.of("Sig"),
      //       Filter: PDFName.of("Adobe.PPKLite"),
      //       SubFilter: PDFName.of("adbe.pkcs7.detached"),
      //       ByteRange: [0, 0, 0, 0],
      //       Contents: PDFHexString.of("A".repeat(SIGNATURE_LENGTH)),
      //       Reason: PDFString.of("Digital Signture"),
      //       M: PDFString.fromDate(new Date()),
      //     });

      //     const signatureDictRef = pdfDoc.context.register(signatureDict);

      //     // Add the signature dictionary to the document
      //     const widgetDict = pdfDoc.context.obj({
      //       Type: "Annot",
      //       Subtype: "Widget",
      //       FT: "Sig",
      //       Rect: [0, 0, 0, 0], // Signature rect size
      //       V: signatureDictRef,
      //       T: PDFString.of("test signature"),
      //       F: 4,
      //       P: pages[0].ref,
      //     });

      //     const widgetDictRef = pdfDoc.context.register(widgetDict);

      //     // Add signature widget to the first page
      //     pages[0].node.set(
      //       PDFName.of("Annots"),
      //       pdfDoc.context.obj([widgetDictRef])
      //     );

      //     pdfDoc.catalog.set(
      //       PDFName.of("AcroForm"),
      //       pdfDoc.context.obj({
      //         SigFlags: 3,
      //         Fields: [widgetDictRef],
      //       })
      //     );

      //     // Create the signature using the private key and password
      //     // const { createPrivateKey } = require("crypto");
      //     // const privateKey = createPrivateKey({
      //     //   key: privateKeyBytes,
      //     //   format: "p12",
      //     //   passphrase: privateKeyPassword,
      //     // });

      //     // Sign the PDF using the private key
      //     // const signature = await pdfDoc.sign(
      //     //   0, // Index of the signature field
      //     //   privateKeyBytes,
      //     //   {
      //     //     reason: "I am the author of this document",
      //     //     name: "Your Name",
      //     //   } // Replace with your name
      //     // );

      //     // Save the signed PDF to a new file
      //     const signedPdfPath = path.join(__dirname, "../signed-pdf.pdf");
      //     const signedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
      //     let spdf = signer.sign(signedPdfBytes, privateKeyBytes);
      //     fs.writeFileSync(signedPdfPath, signedPdfBytes);

      //     console.log("PDF signed and saved successfully:", signedPdfPath);
      //   } catch (error) {
      //     console.error("Error signing the PDF:", error);
      //   }
      // })();

      ///////////////

      ///Create Digital Certificates
      // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      //   modulusLength: 2048,
      //   publicKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      //   privateKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      // });

      // // Writing keys to files.
      // fs.writeFileSync("./keys/private.key", privateKey);
      // fs.writeFileSync("./keys/public.key", publicKey);

      // // Reading keys from files.
      // const pvtKey = privateKey;
      // const pubKey = publicKey;

      // const data = Buffer.from("some data");

      // const signature = crypto
      //   .sign("RSA-SHA256", data, pvtKey)
      //   .toString("base64");
      // console.log("Signing done", signature);

      // const verify = crypto.verify(
      //   "RSA-SHA256",
      //   data,
      //   pubKey,
      //   Buffer.from(signature, "base64")
      // );
      // console.log("verfy done", verify);

      //////

      // async () => {
      //   const p12Buffer = fs.readFileSync(".keys/cert.p12");

      //   let pdfBuffer = fs.readFileSync(`${__dirname}/mergeds.pdf`);
      //   pdfBuffer = plainAddPlaceholder({
      //     pdfBuffer,
      //     reason: "I have reviewed it.",
      //     signatureLength: 1612,
      //   });
      //   pdfBuffer = signer.sign(pdfBuffer, p12Buffer);

      //   const { signature, signedData } = extractSignature(pdfBuffer);
      //   // expect(typeof signature === "string").toBe(true);
      //   // expect(signedData instanceof Buffer).toBe(true);
      //   console.log(pdfBuffer);
      // };

      //////

      ////sign the pdf

      // (async () => {
      //   const pdfBuffer = new SignPDF(
      //     path.resolve("./mergeds.pdf"),
      //     path.resolve("./keys/cert.p12")
      //   );

      //   const signedDocs = await pdfBuffer.signPDF();
      //   const randomNumber = Math.floor(Math.random() * 5000);
      //   const pdfName = `../exported_file_${randomNumber}.pdf`;

      //   fs.writeFileSync(pdfName, signedDocs);
      //   console.log(`New Signed PDF created called: ${pdfName}`);
      // })();

      ///////
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
