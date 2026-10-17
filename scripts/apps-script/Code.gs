const HEADERS = [
  "orderId",
  "paidAt",
  "molliePaymentId",
  "title",
  "size",
  "quantity",
  "totalCents",
  "name",
  "email",
  "street",
  "postalCode",
  "city",
  "country",
  "shippingClass",
  "trackingCode",
  "trackingSentAt",
  "notes",
];

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    const expected = PropertiesService.getScriptProperties().getProperty("SHEET_WEBHOOK_SECRET");
    if (!expected || body.secret !== expected) return json_({ ok: false });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("orders");
    if (!sheet) return json_({ ok: false });

    const map = headerMap_(sheet);
    if (map.orderId === undefined) return json_({ ok: false });

    const orderId = String(body.orderId || "");
    if (!orderId) return json_({ ok: false });
    if (orderExists_(sheet, map.orderId, orderId)) return json_({ ok: true, duplicate: true });

    const row = HEADERS.map((header) => {
      if (header === "trackingCode" || header === "trackingSentAt" || header === "notes") return "";
      if (header === "quantity" || header === "totalCents") return Number(body[header]);
      return body[header] === undefined || body[header] === null ? "" : String(body[header]);
    });

    const width = Math.max(sheet.getLastColumn(), HEADERS.length);
    const line = new Array(width).fill("");
    HEADERS.forEach((header, index) => {
      const column = map[header];
      if (column !== undefined) line[column] = row[index];
    });
    sheet.appendRow(line);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false });
  }
}

function headerMap_(sheet) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  const map = {};
  headers.forEach((name, index) => {
    const key = String(name || "").trim();
    if (key) map[key] = index;
  });
  return map;
}

function orderExists_(sheet, column, orderId) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const values = sheet.getRange(2, column + 1, last - 1, 1).getValues();
  return values.some((cell) => String(cell[0]) === orderId);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
