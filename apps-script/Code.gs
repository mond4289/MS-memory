/**
 * Code.gs — Backend ສຳລັບເວັບເກັບຄວາມຊົງຈຳ
 * ວິທີໃຊ້:
 * 1. ເປີດ Google Sheet ຂອງເຈົ້າ > Extensions > Apps Script
 * 2. ວາງໂຄ້ດນີ້ທັງໝົດລົງໄປ (ລຶບໂຄ້ດເກົ່າອອກ)
 * 3. ແກ້ DRIVE_FOLDER_ID ຖ້າຈຳເປັນ (ຕອນນີ້ໃສ່ຄ່າໂຟນເດີ Drive ຂອງເຈົ້າແລ້ວ)
 * 4. Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. ຄັດລອກ URL ທີ່ໄດ້ ໄປວາງໃນ js/app.js ຕົວແປ API_URL
 */

const DRIVE_FOLDER_ID = "1gJ0AMGEiF9RNUEf6GtG0fixAUsj9Fo7H"; // ໂຟນເດີ Drive ສຳລັບຮູບຄວາມຊົງຈຳ
const PHOTOS_SHEET = "Photos";
const SETTINGS_SHEET = "Settings";

function getSS() { return SpreadsheetApp.getActiveSpreadsheet(); }

function getPhotosSheet() {
  const ss = getSS();
  let sh = ss.getSheetByName(PHOTOS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PHOTOS_SHEET);
    sh.appendRow(["ID", "Caption", "Uploader", "Drive_URL", "Detail", "Upload_Date", "Like_Mond", "Like_Som", "Saved_Mond", "Saved_Som"]);
    // Dropdown (Data validation) ສຳລັບ column ຜູ້ບັນທຶກ (C) — ແກ້ໄດ້ 1000 ແຖວ
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(["mond", "som"], true).build();
    sh.getRange("C2:C1000").setDataValidation(rule);
  }
  return sh;
}

function getSettingsSheet() {
  const ss = getSS();
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
    sh.appendRow(["Key", "Value"]);
    sh.appendRow(["CurrentSong", "song-1"]);
    sh.appendRow(["CurrentColor", "purple"]);
    sh.appendRow(["CurrentLanguage", "lo"]);
    const songRule = SpreadsheetApp.newDataValidation().requireValueInList(["song-1", "song-2", "song-3"], true).build();
    const colorRule = SpreadsheetApp.newDataValidation().requireValueInList(["purple", "lightblue", "orange"], true).build();
    const langRule = SpreadsheetApp.newDataValidation().requireValueInList(["lo", "th", "en"], true).build();
    sh.getRange("B2").setDataValidation(songRule);
    sh.getRange("B3").setDataValidation(colorRule);
    sh.getRange("B4").setDataValidation(langRule);
  }
  return sh;
}

function readPhotos() {
  const sh = getPhotosSheet();
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  return values.map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
}

function readSettings() {
  const sh = getSettingsSheet();
  const values = sh.getDataRange().getValues();
  values.shift();
  const s = {};
  values.forEach(([k, v]) => (s[k] = v));
  return { song: s.CurrentSong, color: s.CurrentColor, lang: s.CurrentLanguage };
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "all") {
    return jsonOut({ photos: readPhotos(), settings: readSettings() });
  }
  return jsonOut({ error: "unknown action" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === "upload") {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const matches = body.imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    const mime = matches[1];
    const bytes = Utilities.base64Decode(matches[2]);
    const blob = Utilities.newBlob(bytes, mime, `photo_${Date.now()}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = `https://drive.google.com/uc?export=view&id=${file.getId()}`;

    const sh = getPhotosSheet();
    const id = Date.now();
    sh.appendRow([id, body.caption, body.uploader, url, body.detail, new Date(), false, false, false, false]);
    return jsonOut({ ok: true, id, url });
  }

  if (action === "like" || action === "save") {
    const sh = getPhotosSheet();
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf("ID");
    const field = action === "like"
      ? (body.user === "mond" ? "Like_Mond" : "Like_Som")
      : (body.user === "mond" ? "Saved_Mond" : "Saved_Som");
    const fieldCol = headers.indexOf(field);
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idCol]) === String(body.id)) {
        sh.getRange(r + 1, fieldCol + 1).setValue(!!body.value);
        break;
      }
    }
    return jsonOut({ ok: true });
  }

  if (action === "edit") {
    const sh = getPhotosSheet();
    const values = sh.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf("ID");
    const capCol = headers.indexOf("Caption");
    const detCol = headers.indexOf("Detail");
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idCol]) === String(body.id)) {
        sh.getRange(r + 1, capCol + 1).setValue(body.caption);
        sh.getRange(r + 1, detCol + 1).setValue(body.detail);
        break;
      }
    }
    return jsonOut({ ok: true });
  }

  if (action === "settings") {
    const sh = getSettingsSheet();
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (values[r][0] === body.key) {
        sh.getRange(r + 1, 2).setValue(body.value);
        return jsonOut({ ok: true });
      }
    }
    sh.appendRow([body.key, body.value]);
    return jsonOut({ ok: true });
  }

  return jsonOut({ error: "unknown action" });
}
