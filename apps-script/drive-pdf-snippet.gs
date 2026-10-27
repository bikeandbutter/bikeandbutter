/**
 * Add to the Apps Script web app that receives bnbhq's savePdf requests (the one whose URL starts AKfycbyNMIV4…).
 * bnbhq now sends { action:'savePdf', kind:'invoice' | 'quotation', pdfBase64, filename, baseInvNo }.
 * Quotations go to their own folder. Invoices keep going wherever your current script puts them.
 */
var QUOTATIONS_FOLDER_ID = 'PASTE_THE_FOLDER_ID_HERE';   // open the Drive folder; the ID is the last part of its URL

function saveQuotationPdf_(body) {
  var folder = DriveApp.getFolderById(QUOTATIONS_FOLDER_ID);
  var blob = Utilities.newBlob(Utilities.base64Decode(body.pdfBase64), 'application/pdf', body.filename);
  var existing = folder.getFilesByName(body.filename);
  while (existing.hasNext()) existing.next().setTrashed(true);   // re-saving the same quotation number replaces the old PDF
  var file = folder.createFile(blob);
  return { ok: true, filename: file.getName(), url: file.getUrl() };
}

// In your existing doPost, right after the body is parsed and before the invoice logic, add:
//   if (body.action === 'savePdf' && body.kind === 'quotation') return ContentService
//     .createTextOutput(JSON.stringify(saveQuotationPdf_(body))).setMimeType(ContentService.MimeType.JSON);
