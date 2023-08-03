import ejs from "ejs";
import pdf from "html-pdf";

var options = { format: "A4" };

const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PDF Document</title>
  </head>
  <style>
    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .flex {
      display: flex;
    }

    .flex1 {
      flex: 1;
    }
    .flexFull {
      display: flex;
      flex: 1;
    }

    table,
    th,
    td {
      border: 1px solid black;
    }
    table {
      border-collapse: collapse;
    }
  </style>
  <body>
    <div class="flexFull">
      <div class="flexFull">Name</div>
      <div class="flexFull">Address</div>
    </div>
    <div>
      <table>
        <tbody>
          <tr>
            <td>ESTIMATE SUMMARY</td>
          </tr>
          <tr>
            <td>Client Name</td>
            <td><%= name %></td>
          </tr>
          <tr>
            <td>Client Address</td>
            <td><%= address %></td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
`;

const htmlMarkup = ejs.render(template, {
  name: "Namibian Chitta",
  address: "Janglatlya Bhokat",
});

pdf.create(htmlMarkup, options).toFile("./estimate.pdf", function (err, res) {
  if (err) return console.log(err);
  console.log(res);
});
