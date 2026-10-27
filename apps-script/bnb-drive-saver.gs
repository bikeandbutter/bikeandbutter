/**
 * Bike & Butter — PDF saver for bnbhq.  Standalone Apps Script web app (script.google.com > New project).
 * bnbhq POSTs { action:'savePdf', kind:'invoice'|'quotation'|'service_report', pdfBase64, filename, baseInvNo }.
 *
 *  - invoices          -> your existing invoice folder
 *  - quotations        -> "Quotations" folder (created automatically next to the invoice folder)
 *  - service reports   -> "Servicing Reports" folder (created automatically next to the invoice folder)
 * Saving a file with the same name again replaces the earlier copy.
 */
var INVOICES_FOLDER_ID = '135Iba65rSf4wldfaCh0m7AzJW9v6HVRr';   // where your invoice PDFs already live
var KIND_FOLDERS = { quotation: 'Quotations', service_report: 'Servicing Reports' };

function doGet() { return json_({ ok: true, service: 'bnb-drive-saver' }); }

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body || body.action !== 'savePdf') return json_({ ok: false, error: 'unknown action' });
    if (!body.pdfBase64 || !body.filename) return json_({ ok: false, error: 'missing pdf or filename' });
    var folder = folderFor_(body.kind || 'invoice');
    var name = String(body.filename).replace(/[\\\/:*?"<>|]/g, '-');
    var existing = folder.getFilesByName(name);
    while (existing.hasNext()) existing.next().setTrashed(true);
    var blob = Utilities.newBlob(Utilities.base64Decode(body.pdfBase64), 'application/pdf', name);
    var file = folder.createFile(blob);
    return json_({ ok: true, filename: file.getName(), url: file.getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function folderFor_(kind) {
  var invoices = DriveApp.getFolderById(INVOICES_FOLDER_ID);
  if (!KIND_FOLDERS[kind]) return invoices;
  var parents = invoices.getParents();
  var parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var found = parent.getFoldersByName(KIND_FOLDERS[kind]);
  return found.hasNext() ? found.next() : parent.createFolder(KIND_FOLDERS[kind]);
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
