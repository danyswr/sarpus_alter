# Perbaikan Google Apps Script untuk Column Alignment

## Masalah
Data registrasi user baru tidak sesuai dengan kolom spreadsheet yang sudah ada.

## Solusi
Ganti kode Google Apps Script bagian `handleRegister` dengan kode berikut:

```javascript
function handleRegister(e) {
  try {
    var userData = getUserData(e);

    if (!userData.email || !userData.username || !userData.password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    // Cek apakah email sudah ada
    var data = usersSheet.getDataRange().getValues();
    var EMAIL_COL = 1; // Email ada di kolom ke-2 (index 1)

    for (var i = 1; i < data.length; i++) {
      if (data[i][EMAIL_COL] === userData.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    // Generate ID user baru
    var newId = "USER_" + Date.now();
    
    // PENTING: Urutan kolom harus PERSIS seperti header spreadsheet
    // ID Users | Email | Username | Password | NIM | Gender | Jurusan | Role | TimeStamp
    var newRow = [
      newId,                        // A: ID Users
      userData.email,               // B: Email
      userData.username,            // C: Username
      userData.password,            // D: Password
      userData.nim || "",           // E: NIM
      userData.gender || "Male",    // F: Gender
      userData.jurusan || "",       // G: Jurusan
      userData.role || "user",      // H: Role
      new Date()                    // I: TimeStamp
    ];

    Logger.log("Adding new user with data: " + JSON.stringify(newRow));
    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      idUsers: newId,
      username: userData.username,
      email: userData.email,
      role: userData.role || "user",
      nim: userData.nim || "",
      jurusan: userData.jurusan || "",
      gender: userData.gender || "Male"
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}
```

## Langkah-langkah:
1. Buka Google Apps Script editor
2. Ganti fungsi `handleRegister` dengan kode di atas
3. Save dan deploy ulang script
4. Test registrasi user baru

## Penjelasan:
- Kode ini memastikan data dimasukkan sesuai urutan kolom yang benar
- Setiap kolom dipetakan dengan jelas ke posisi yang tepat
- Menggunakan `appendRow()` untuk menambah data di baris baru