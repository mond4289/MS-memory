# ເວັບເກັບຄວາມຊົງຈຳ — ຄູ່ມືຕິດຕັ້ງ

## 1. ຊື່ Project (3 ພາສາ)
ເປີດ `js/i18n.js` ຊອກຫາ key `project_name` ໃນແຕ່ລະພາສາ (`lo`, `th`, `en`) ແລ້ວແກ້ຄ່າ:
```js
lo: { project_name: "ຊື່ພາສາລາວ", ... }
th: { project_name: "ชื่อภาษาไทย", ... }
en: { project_name: "English name", ... }
```
ບໍ່ຕ້ອງແກ້ບ່ອນອື່ນອີກ — ຊື່ຈະປ່ຽນຕາມພາສາທີ່ເລືອກໃນທຸກໜ້າອັດຕະໂນມັດ

## 2. ສ້າງ Google Sheet
1. ໄປ https://sheets.new ສ້າງ Sheet ໃໝ່ ຕັ້ງຊື່ຫຍັງກໍໄດ້
2. ເປີດ Extensions > Apps Script
3. ລຶບໂຄ້ດເກົ່າ, ວາງໂຄ້ດຈາກ `apps-script/Code.gs` ລົງໄປແທນ
4. ກົດ Deploy > New deployment > ເລືອກ type "Web app"
   - Execute as: **Me**
   - Who has access: **Anyone**
5. ອະນຸຍາດສິດ (authorize) ຕາມທີ່ Google ຖາມ
6. ຄັດລອກ **Web app URL** ທີ່ໄດ້
7. ເປີດ `js/app.js` ວາງ URL ນັ້ນແທນ `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE`

ຄັ້ງທຳອິດທີ່ script ຮັນ (ໂຫລດໜ້າເວັບຄັ້ງທຳອິດ ຫຼື ອັບໂຫລດຮູບທຳອິດ) ມັນຈະສ້າງ tab
`Photos` ແລະ `Settings` ໃຫ້ອັດຕະໂນມັດ ພ້ອມ header ທີ່ຖືກຕ້ອງ.

## 3. Drive folder
ໂຟນເດີນີ້ຖືກໃສ່ໄວ້ໃນໂຄ້ດແລ້ວ (ໃຊ້ເກັບແຕ່ຮູບຄວາມຊົງຈຳທີ່ user ອັບໂຫລດ):
https://drive.google.com/drive/folders/1gJ0AMGEiF9RNUEf6GtG0fixAUsj9Fo7H

## 4. ອັບໂຫລດ asset ຕ່າງໆ
ເບິ່ງລາຍການຊື່ໄຟລ໌ທີ່ຕ້ອງໃຊ້ໃນ `assets/README.txt` — ວາງໄຟລ໌ຈິງ (icon, background, ເພງ)
ລົງໃນໂຟນເດີ `assets/` ຂອງ repo ນີ້ (ບໍ່ແມ່ນ Google Drive)

## 5. Deploy ຂຶ້ນ Cloudflare Pages
1. Push repo ນີ້ຂຶ້ນ GitHub
2. ໄປ https://dash.cloudflare.com > Workers & Pages > Create > Pages > Connect to Git
3. ເລືອກ repo ນີ້
4. Build settings: **ບໍ່ຕ້ອງມີ build command, Output directory = `/`** (ນີ້ແມ່ນ static site ທຳມະດາ)
5. Deploy

## ໂຄງສ້າງໄຟລ໌
```
index.html          ໜ້າ login + app shell (SPA, ຄວບຄຸມການສະຫຼັບໜ້າດ້ວຍ JS)
css/style.css        ສະໄຕລ໌ທັງໝົດ, theme ສີຜ່ານ CSS variables
js/i18n.js            ຂໍ້ຄວາມ 3 ພາສາ
js/app.js              logic ຫຼັກ (login, feed, upload, like/save, memories, search, settings)
apps-script/Code.gs   ໂຄ້ດ backend ວາງໃນ Google Apps Script
assets/                ໄອຄອນ/ຮູບພື້ນຫຼັງ/ເພງ (ຕ້ອງອັບໂຫລດເອງ)
```

## ສະຖານະ
- ✅ ປຸ່ມ "ແກ້ໄຂ" ໃນ popup ຮູບ ໃຊ້ໄດ້ຈິງ (ແກ້ Caption/Detail, ບັນທຶກກັບ Sheet)
- ✅ Search ຮອງຮັບຄຳໃກ້ຄຽງ (fuzzy, edit-distance) ນອກຈາກ substring match
- ✅ Google Sheet ມີ dropdown (data validation) ໃນ column ຜູ້ບັນທຶກ ແລະ Settings ໃຫ້ອັດຕະໂນມັດ ຕອນສ້າງ sheet ຄັ້ງທຳອິດ
- ✅ ໄອຄອນປ່ຽນຕາມໂທນສີທີ່ເລືອກ (3 ໂຟນເດີ: icons-purple / icons-lightblue / icons-orange)
- ✅ ພາສາປ່ຽນຄົບ 100% (ຊື່ project, ຖືກໃຈໂດຍ mond/som, ຊື່ເພງ, ຊື່ໂທນສີ)
- ✅ ໜ້າຕັ້ງຄ່າ card ແບບແກ້ວໃສ (frosted glass)
- ✅ ປຸ່ມ "ໜ້າຫຼັກ" ຢູ່ top bar
- ✅ ອັບໂຫລດຮູບ ມີ error message ຊັດເຈນ ຖ້າຜິດພາດ (ບໍ່ແມ່ນງຽບໆອີກຕໍ່ໄປ)

## ຖ້າອັບໂຫລດຮູບບໍ່ໄດ້ (ແກ້ບັນຫາ)
1. ກົດອັບໂຫລດອີກຄັ້ງ ຈະມີ alert ບອກ error ຊັດເຈນຂຶ້ນ — ອ່ານຂໍ້ຄວາມ error ນັ້ນກ່ອນ
2. ກວດ `js/app.js` ວ່າ `API_URL` ຖືກວາງ URL ຈິງແລ້ວ (ບໍ່ແມ່ນ `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE`)
3. ຖ້າແກ້ Code.gs ພາຍຫຼັງເຄີຍ deploy ໄປແລ້ວ — ຕ້ອງ Deploy > Manage deployments > ✏️ (Edit) > Version: New version > Deploy ອີກຄັ້ງ (ບໍ່ດັ່ງນັ້ນ URL ເກົ່າຈະຍັງໃຊ້ໂຄ້ດເກົ່າຢູ່)
4. ລອງຮູບນ້ອຍໆກ່ອນ (< 3MB) ເພາະຮູບໃຫຍ່ອາດຊ້າ ຫຼື timeout ໃນເນັດຊ້າ
