// COPY THIS EXACT CODE TO YOUR GOOGLE APPS SCRIPT
// Replace the handleRegister function with this version

function handleRegister(e) {
  try {
    var userData = getUserData(e);
    Logger.log("Registration data received: " + JSON.stringify(userData));

    if (!userData.email || !userData.username || !userData.password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    // Cek header untuk memastikan struktur benar
    var headers = usersSheet.getRange(1, 1, 1, 9).getValues()[0];
    Logger.log("Current headers: " + JSON.stringify(headers));

    // Cek apakah email sudah ada
    var data = usersSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === userData.email) { // Email di kolom B (index 1)
        return { error: "Email sudah terdaftar" };
      }
    }

    // Generate ID user baru
    var newId = "USER_" + Date.now();
    var lastRow = usersSheet.getLastRow() + 1;
    
    Logger.log("Adding user to row: " + lastRow);
    
    // Insert data menggunakan setValue untuk setiap kolom
    // Struktur: A=ID Users, B=Email, C=Username, D=Password, E=NIM, F=Gender, G=Jurusan, H=Role, I=TimeStamp
    usersSheet.getRange(lastRow, 1).setValue(newId);                          // A: ID Users
    usersSheet.getRange(lastRow, 2).setValue(userData.email);                 // B: Email
    usersSheet.getRange(lastRow, 3).setValue(userData.username);              // C: Username
    usersSheet.getRange(lastRow, 4).setValue(userData.password);              // D: Password
    usersSheet.getRange(lastRow, 5).setValue(userData.nim || "");             // E: NIM
    usersSheet.getRange(lastRow, 6).setValue(userData.gender || "Male");      // F: Gender
    usersSheet.getRange(lastRow, 7).setValue(userData.jurusan || "");         // G: Jurusan
    usersSheet.getRange(lastRow, 8).setValue(userData.role || "user");        // H: Role
    usersSheet.getRange(lastRow, 9).setValue(new Date());                     // I: TimeStamp

    Logger.log("User successfully added with ID: " + newId);

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