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

const copyTo_ = "v.abrahamian@hotmail.com";
const serif_ = "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif";
const sans_ = "Helvetica, Arial, sans-serif";

// Installable "On edit" trigger only. A simple onEdit cannot call Resend.
function onTrackingEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "orders") return;
  if (e.range.getRow() < 2 || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;

  const map = headerMap_(sheet);
  if (map.trackingCode === undefined || e.range.getColumn() !== map.trackingCode + 1) return;

  const code = String(e.range.getValue() || "").trim();
  if (!code) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    sendTracking_(sheet, map, e.range.getRow(), code);
  } finally {
    lock.releaseLock();
  }
}

function sendTracking_(sheet, map, row, code) {
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const cell = (header) => (map[header] === undefined ? "" : values[map[header]]);
  if (String(cell("trackingSentAt") || "").trim()) return;

  const email = String(cell("email") || "").trim();
  if (!email) {
    writeCell_(sheet, map, row, "notes", "missing email");
    return;
  }

  const props = PropertiesService.getScriptProperties();
  const key = String(props.getProperty("RESEND_API_KEY") || "").trim();
  const from = String(props.getProperty("RESEND_FROM") || "").trim();
  const replyTo = String(props.getProperty("MERCHANT_ORDER_EMAIL") || "").trim();
  if (!key || !from || !replyTo) {
    writeCell_(sheet, map, row, "notes", "email is not configured");
    return;
  }

  const order = {
    orderId: String(cell("orderId") || ""),
    title: String(cell("title") || ""),
    size: String(cell("size") || ""),
    quantity: Number(cell("quantity")) || 1,
    name: String(cell("name") || ""),
    postalCode: String(cell("postalCode") || ""),
    country: String(cell("country") || ""),
    code: code,
  };
  const trackUrl = trackUrl_(order);

  const payload = {
    from: from,
    to: email,
    subject: "Your order is on the way",
    html: trackingHtml_(order, trackUrl),
    text: trackingText_(order, trackUrl),
    reply_to: replyTo,
  };
  if (email.toLowerCase() !== copyTo_) payload.bcc = copyTo_;

  try {
    const response = UrlFetchApp.fetch("https://api.resend.com/emails", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + key },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const status = response.getResponseCode();
    if (status < 200 || status >= 300) {
      writeCell_(sheet, map, row, "notes", "email failed: " + status);
      return;
    }
    writeCell_(sheet, map, row, "trackingSentAt", new Date().toISOString());
    writeCell_(sheet, map, row, "notes", "");
  } catch (error) {
    writeCell_(sheet, map, row, "notes", String(error && error.message ? error.message : error).slice(0, 300));
  }
}

function trackUrl_(order) {
  const postal = order.postalCode.replace(/\s+/g, "");
  const country = order.country || "NL";
  return (
    "https://postnl.nl/tracktrace/?B=" +
    encodeURIComponent(order.code) +
    "&D=" +
    encodeURIComponent(country) +
    "&P=" +
    encodeURIComponent(postal) +
    "&T=C"
  );
}

function trackingLabel_(order) {
  const name = order.size ? order.title + " (" + order.size + ")" : order.title;
  return order.quantity > 1 ? order.quantity + " × " + name : name;
}

function trackingText_(order, trackUrl) {
  const who = firstName_(order.name);
  return [
    "Hi " + who + ",",
    "",
    trackingLabel_(order) + " is on the way.",
    "",
    "Track it: " + trackUrl,
    "",
    "If the link does not open, the barcode is " + order.code + ".",
    "",
    "Order " + order.orderId,
  ].join("\n");
}

function trackingHtml_(order, trackUrl) {
  const who = escapeHtml_(firstName_(order.name));
  const label = escapeHtml_(trackingLabel_(order));
  const code = escapeHtml_(order.code);
  const orderId = escapeHtml_(order.orderId);
  const href = escapeHtml_(trackUrl);
  return (
    '<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f4efe6;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;"><tr><td align="center" style="padding:48px 20px;">' +
    '<table role="presentation" width="460" cellpadding="0" cellspacing="0" style="width:100%;max-width:460px;">' +
    '<tr><td style="font-family:' + serif_ + ';font-size:28px;letter-spacing:0.14em;color:#16140f;">ARA</td></tr>' +
    '<tr><td style="padding-top:28px;font-family:' + serif_ + ';font-size:26px;line-height:1.25;color:#16140f;">On its way, ' + who + '.</td></tr>' +
    '<tr><td style="padding-top:12px;font-family:' + sans_ + ';font-size:15px;line-height:1.5;color:#5c564e;">' + label + " is with PostNL.</td></tr>" +
    '<tr><td style="padding-top:28px;"><a href="' + href + '" style="display:inline-block;background:#16140f;color:#f4efe6;font-family:' + sans_ + ';font-size:15px;line-height:1;text-decoration:none;padding:14px 18px;">Track the parcel</a></td></tr>' +
    '<tr><td style="padding-top:16px;font-family:' + sans_ + ';font-size:13px;line-height:1.5;color:#8a8378;">If the button does not open, the barcode is ' + code + ".</td></tr>" +
    '<tr><td style="padding-top:32px;font-family:' + sans_ + ';font-size:13px;color:#8a8378;">Order ' + orderId + "</td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

function firstName_(name) {
  const word = String(name || "").trim().split(/\s+/)[0];
  return word || "there";
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeCell_(sheet, map, row, header, value) {
  if (map[header] === undefined) return;
  sheet.getRange(row, map[header] + 1).setValue(value);
}
