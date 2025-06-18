/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - UPDATED VERSION WITH IMAGE UPLOAD
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET YANG BENAR:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 * 
 * GOOGLE DRIVE FOLDER ID untuk menyimpan gambar:
 * 1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw
 */

// Google Drive folder ID untuk menyimpan gambar
var DRIVE_FOLDER_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function doOptions(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

    // Handle preflight OPTIONS request
    if (e.method === "OPTIONS") {
      return response.setContent(JSON.stringify({ 
        status: "ok",
        message: "CORS preflight successful"
      }));
    }

    var action = getAction(e);
    Logger.log("Action: " + action);
    Logger.log("Method: " + e.method);
    Logger.log("Parameters: " + JSON.stringify(e.parameter));
    if (e.postData) {
      Logger.log("POST data: " + e.postData.contents);
    }

    var result = {};

    switch(action) {
      case "test":
        result = testConnection();
        break;
      case "login":
        result = handleLogin(e);
        break;
      case "register":
        result = handleRegister(e);
        break;
      case "getPosts":
        result = handleGetPosts();
        break;
      case "createPost":
        result = handleCreatePost(e);
        break;
      case "likePost":
        result = handleLikePost(e);
        break;
      case "dislikePost":
        result = handleDislikePost(e);
        break;
      case "deletePost":
        result = handleDeletePost(e);
        break;
      case "getProfile":
        result = handleGetProfile(e);
        break;
      case "updateProfile":
        result = handleUpdateProfile(e);
        break;
      case "uploadImage":
        result = handleUploadImage(e);
        break;
      case "getAdminStats":
        result = handleGetAdminStats();
        break;
      default:
        result = { error: "Action tidak dikenal: " + action };
    }

    response.setContent(JSON.stringify(result));
    return response;

  } catch (error) {
    Logger.log("Error in handleRequest: " + error.toString());
    var errorResponse = ContentService.createTextOutput();
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    errorResponse.setContent(JSON.stringify({ 
      error: "Server error: " + error.toString(),
      timestamp: new Date().toISOString()
    }));
    return errorResponse;
  }
}

function getAction(e) {
  if (e.parameter && e.parameter.action) {
    return e.parameter.action;
  }

  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return postData.action || "test";
    } catch (parseError) {
      Logger.log("Parse error: " + parseError.toString());
    }
  }

  return "test";
}

function testConnection() {
  return {
    message: "Connection successful",
    timestamp: new Date().toISOString(),
    status: "ok",
    methods_supported: ["GET", "POST"],
    cors_enabled: true
  };
}

function handleLogin(e) {
  try {
    var credentials = getCredentials(e);
    var email = credentials.email;
    var password = credentials.password;

    Logger.log("Login attempt for: " + email);
    Logger.log("Password received: " + (password ? "Yes (length: " + password.length + ")" : "No"));

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();
    Logger.log("Total users in sheet: " + (data.length - 1));
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    // Struktur kolom yang benar: ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
    var ID_COL = 0;      // ID Users
    var EMAIL_COL = 1;   // Email  
    var USERNAME_COL = 2; // Username
    var PASSWORD_COL = 3; // Password
    var NIM_COL = 4;     // NIM
    var GENDER_COL = 5;  // Gender
    var JURUSAN_COL = 6; // Jurusan
    var ROLE_COL = 7;    // Role
    var TIMESTAMP_COL = 8; // TimeStamp

    // Cari user berdasarkan email
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var userEmail = row[EMAIL_COL];
      var userPassword = row[PASSWORD_COL];
      
      if (userEmail && userEmail.toString().toLowerCase() === email.toLowerCase()) {
        Logger.log("User found! Checking password...");
        
        // Support both plain text and hashed password
        if (userPassword.toString() === password.toString() || 
            verifyHashedPassword(password, userPassword.toString())) {
          Logger.log("Password match!");
          
          return {
            message: "Login berhasil",
            user: {
              idUsers: row[ID_COL] || "USER_" + i,
              username: row[USERNAME_COL] || email.split('@')[0],
              email: email,
              role: row[ROLE_COL] || "user",
              nim: row[NIM_COL] || "",
              jurusan: row[JURUSAN_COL] || "",
              gender: row[GENDER_COL] || ""
            }
          };
        } else {
          Logger.log("Password mismatch!");
          return { error: "Password salah" };
        }
      }
    }

    Logger.log("User not found with email: " + email);
    return { error: "Email tidak ditemukan" };

  } catch (error) {
    Logger.log("Login error: " + error.toString());
    return { error: "Error login: " + error.toString() };
  }
}

function handleRegister(e) {
  try {
    var userData = getUserData(e);

    if (!userData.email || !userData.username || !userData.password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    // Validasi NIM (harus berisi angka saja)
    if (userData.nim && !/^\d+$/.test(userData.nim)) {
      return { error: "NIM harus berisi angka saja" };
    }

    // Validasi Gender (hanya "Male" atau "Female")
    if (userData.gender && userData.gender.toLowerCase() !== "male" && userData.gender.toLowerCase() !== "female") {
      return { error: "Gender harus 'Male' atau 'Female'" };
    }
    userData.gender = userData.gender ? userData.gender.toLowerCase() : "male"; // Default ke "male" jika kosong

    // Validasi Role (hanya "user" atau "admin")
    if (userData.role && userData.role.toLowerCase() !== "user" && userData.role.toLowerCase() !== "admin") {
      return { error: "Role harus 'user' atau 'admin'" };
    }
    userData.role = userData.role ? userData.role.toLowerCase() : "user"; // Default ke "user" jika kosong

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      // Buat sheet Users jika belum ada dengan struktur yang benar
      usersSheet = spreadsheet.insertSheet("Users");
      // Header sesuai struktur spreadsheet: ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
      usersSheet.getRange(1, 1, 1, 9).setValues([[
        "ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "TimeStamp"
      ]]);
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
    
    // Buat row baru sesuai urutan kolom yang benar
    var newRow = [
      newId,                        // ID Users
      userData.email,               // Email
      userData.username,            // Username
      userData.password,            // Password (sudah di-hash dari server)
      userData.nim || "",           // NIM
      userData.gender,              // Gender
      userData.jurusan || "",       // Jurusan
      userData.role,                // Role
      new Date()                    // TimeStamp
    ];

    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      user: {
        idUsers: newId,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        nim: userData.nim || "",
        jurusan: userData.jurusan || ""
      }
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}

// Simple password verification for bcrypt-like hashes
function verifyHashedPassword(plainPassword, hashedPassword) {
  // Jika password dimulai dengan $2, itu kemungkinan bcrypt hash
  if (hashedPassword.indexOf('$2') === 0) {
    // Untuk sementara, return false karena tidak bisa verify bcrypt di Google Apps Script
    // Nanti akan ditangani di server side
    return false;
  }
  return plainPassword === hashedPassword;
}

function handleGetPosts() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!postingSheet) {
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 8).setValues([[
        "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
      ]]);
      return [];
    }

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];

    if (postData.length < 2) {
      return [];
    }

    var postHeaders = postData[0];
    var posts = [];

    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      var post = {
        id: row[findColumn(postHeaders, "idPostingan")] || "POST_" + i,
        idPostingan: row[findColumn(postHeaders, "idPostingan")] || "POST_" + i,
        userId: row[findColumn(postHeaders, "idUsers")] || "",
        idUsers: row[findColumn(postHeaders, "idUsers")] || "",
        timestamp: row[findColumn(postHeaders, "timestamp")] || new Date(),
        judul: row[findColumn(postHeaders, "judul")] || "",
        deskripsi: row[findColumn(postHeaders, "deskripsi")] || "",
        imageUrl: row[findColumn(postHeaders, "imageUrl")] || "",
        likes: parseInt(row[findColumn(postHeaders, "likeCount")] || 0),
        dislikes: parseInt(row[findColumn(postHeaders, "dislikeCount")] || 0),
        username: "Anonymous"
      };

      // Cari username dari Users sheet (kolom Username ada di index 2)
      if (userData.length > 1 && post.userId) {
        for (var j = 1; j < userData.length; j++) {
          if (userData[j][0] === post.userId) { // ID Users di kolom 0
            post.username = userData[j][2] || "Anonymous"; // Username di kolom 2
            break;
          }
        }
      }

      posts.push(post);
    }

    return posts;

  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return [];
  }
}

function handleCreatePost(e) {
  try {
    var postData = getPostData(e);

    if (!postData.userId || !postData.deskripsi) {
      return { error: "userId dan deskripsi harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 8).setValues([[
        "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
      ]]);
    }

    var newId = "POST_" + Date.now();
    var newRow = [
      newId,
      postData.userId,
      postData.judul || "",
      postData.deskripsi,
      postData.imageUrl || "",
      new Date(),
      0,
      0
    ];

    postingSheet.appendRow(newRow);

    return {
      message: "Postingan berhasil dibuat",
      post: {
        id: newId,
        idPostingan: newId,
        userId: postData.userId,
        idUsers: postData.userId,
        judul: postData.judul || "",
        deskripsi: postData.deskripsi,
        imageUrl: postData.imageUrl || "",
        timestamp: new Date(),
        likes: 0,
        dislikes: 0
      }
    };

  } catch (error) {
    Logger.log("Create post error: " + error.toString());
    return { error: "Error membuat postingan: " + error.toString() };
  }
}

function handleUploadImage(e) {
  try {
    var uploadData = getUploadData(e);
    var imageBase64 = uploadData.imageBase64;
    var fileName = uploadData.fileName || "image_" + Date.now() + ".jpg";

    Logger.log("Upload image attempt for file: " + fileName);

    if (!imageBase64) {
      return { error: "Data gambar harus diisi" };
    }

    // Remove data URL prefix if present (data:image/jpeg;base64,)
    var base64Data = imageBase64;
    if (imageBase64.indexOf(',') !== -1) {
      base64Data = imageBase64.split(',')[1];
    }

    // Convert base64 to blob
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);

    // Get the target folder
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Create the file in Google Drive
    var file = folder.createFile(blob);
    
    // Set file to be publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Generate public URL
    var fileId = file.getId();
    var publicUrl = "https://drive.google.com/uc?id=" + fileId + "&export=view";

    Logger.log("Image uploaded successfully: " + publicUrl);

    return {
      message: "Gambar berhasil diupload",
      imageUrl: publicUrl,
      fileId: fileId,
      fileName: fileName
    };

  } catch (error) {
    Logger.log("Upload image error: " + error.toString());
    return { error: "Error upload gambar: " + error.toString() };
  }
}

function handleLikePost(e) {
  return handleLikeDislike(e, "like");
}

function handleDislikePost(e) {
  return handleLikeDislike(e, "dislike");
}

function handleLikeDislike(e, type) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var headers = postData[0];
    var idCol = findColumn(headers, "idPostingan");
    var likeCol = findColumn(headers, "likeCount");
    var dislikeCol = findColumn(headers, "dislikeCount");

    for (var i = 1; i < postData.length; i++) {
      if (postData[i][idCol] === postId) {
        var currentLikes = parseInt(postData[i][likeCol] || 0);
        var currentDislikes = parseInt(postData[i][dislikeCol] || 0);

        if (type === "like") {
          currentLikes += 1;
        } else {
          currentDislikes += 1;
        }

        postingSheet.getRange(i + 1, likeCol + 1).setValue(currentLikes);
        postingSheet.getRange(i + 1, dislikeCol + 1).setValue(currentDislikes);

        return {
          message: "Berhasil update " + type,
          newLikeCount: currentLikes,
          newDislikeCount: currentDislikes
        };
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error update like/dislike: " + error.toString() };
  }
}

function handleDeletePost(e) {
  try {
    var data = getDeletePostData(e);
    var postId = data.postId;
    var userId = data.userId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var headers = postData[0];
    var idCol = findColumn(headers, "idPostingan");
    var userIdCol = findColumn(headers, "idUsers");

    for (var i = 1; i < postData.length; i++) {
      if (postData[i][idCol] === postId) {
        // Check if user owns this post or is admin
        if (userId && postData[i][userIdCol] !== userId) {
          // Check if user is admin
          var userRole = getUserRole(userId);
          if (userRole !== "admin") {
            return { error: "Anda tidak memiliki izin untuk menghapus postingan ini" };
          }
        }

        // Delete the row
        postingSheet.deleteRow(i + 1);

        return {
          message: "Postingan berhasil dihapus"
        };
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Delete post error: " + error.toString());
    return { error: "Error menghapus postingan: " + error.toString() };
  }
}

function getUserRole(userId) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");
    
    if (!usersSheet) return "user";
    
    var userData = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) { // ID Users di kolom 0
        return userData[i][7] || "user"; // Role di kolom 7
      }
    }
    
    return "user";
  } catch (error) {
    Logger.log("Get user role error: " + error.toString());
    return "user";
  }
}

function handleGetProfile(e) {
  try {
    var data = getProfileData(e);
    var userId = data.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var userData = usersSheet.getDataRange().getValues();

    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) { // ID Users di kolom 0
        return {
          user: {
            idUsers: userData[i][0],
            email: userData[i][1],
            username: userData[i][2],
            nim: userData[i][4] || "",
            gender: userData[i][5] || "",
            jurusan: userData[i][6] || "",
            role: userData[i][7] || "user"
          }
        };
      }
    }

    return { error: "User tidak ditemukan" };

  } catch (error) {
    Logger.log("Get profile error: " + error.toString());
    return { error: "Error mengambil profile: " + error.toString() };
  }
}

function handleUpdateProfile(e) {
  try {
    var data = getUpdateProfileData(e);
    var userId = data.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var userData = usersSheet.getDataRange().getValues();

    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) { // ID Users di kolom 0
        // Update fields
        if (data.username) usersSheet.getRange(i + 1, 3).setValue(data.username); // Username
        if (data.nim) usersSheet.getRange(i + 1, 5).setValue(data.nim); // NIM
        if (data.gender) usersSheet.getRange(i + 1, 6).setValue(data.gender); // Gender
        if (data.jurusan) usersSheet.getRange(i + 1, 7).setValue(data.jurusan); // Jurusan

        return {
          message: "Profile berhasil diupdate",
          user: {
            idUsers: userData[i][0],
            email: userData[i][1],
            username: data.username || userData[i][2],
            nim: data.nim || userData[i][4],
            gender: data.gender || userData[i][5],
            jurusan: data.jurusan || userData[i][6],
            role: userData[i][7] || "user"
          }
        };
      }
    }

    return { error: "User tidak ditemukan" };

  } catch (error) {
    Logger.log("Update profile error: " + error.toString());
    return { error: "Error update profile: " + error.toString() };
  }
}

function handleGetAdminStats() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    var stats = {
      totalPosts: 0,
      totalUsers: 0,
      totalLikes: 0,
      totalDislikes: 0,
      todayPosts: 0
    };

    if (postingSheet) {
      var postData = postingSheet.getDataRange().getValues();
      if (postData.length > 1) {
        var headers = postData[0];
        var likeCol = findColumn(headers, "likeCount");
        var dislikeCol = findColumn(headers, "dislikeCount");
        var timestampCol = findColumn(headers, "timestamp");

        stats.totalPosts = postData.length - 1;

        var today = new Date().toDateString();

        for (var i = 1; i < postData.length; i++) {
          stats.totalLikes += parseInt(postData[i][likeCol] || 0);
          stats.totalDislikes += parseInt(postData[i][dislikeCol] || 0);

          var postDate = new Date(postData[i][timestampCol]).toDateString();
          if (postDate === today) {
            stats.todayPosts++;
          }
        }
      }
    }

    if (usersSheet) {
      var userData = usersSheet.getDataRange().getValues();
      if (userData.length > 1) {
        stats.totalUsers = userData.length - 1;
      }
    }

    return { stats: stats };

  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error mengambil statistik admin: " + error.toString() };
  }
}

// Helper functions
function findColumn(headers, columnName) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase() === columnName.toLowerCase()) {
      return i;
    }
  }
  return -1;
}

function getCredentials(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        email: postData.email,
        password: postData.password
      };
    } catch (error) {
      Logger.log("Parse credentials error: " + error.toString());
    }
  }
  
  return {
    email: e.parameter.email || "",
    password: e.parameter.password || ""
  };
}

function getUserData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        email: postData.email,
        username: postData.username,
        password: postData.password,
        nim: postData.nim,
        jurusan: postData.jurusan,
        gender: postData.gender,
        role: postData.role
      };
    } catch (error) {
      Logger.log("Parse user data error: " + error.toString());
    }
  }
  
  return {
    email: e.parameter.email || "",
    username: e.parameter.username || "",
    password: e.parameter.password || "",
    nim: e.parameter.nim || "",
    jurusan: e.parameter.jurusan || "",
    gender: e.parameter.gender || "",
    role: e.parameter.role || ""
  };
}

function getPostData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        userId: postData.userId,
        judul: postData.judul,
        deskripsi: postData.deskripsi,
        imageUrl: postData.imageUrl
      };
    } catch (error) {
      Logger.log("Parse post data error: " + error.toString());
    }
  }
  
  return {
    userId: e.parameter.userId || "",
    judul: e.parameter.judul || "",
    deskripsi: e.parameter.deskripsi || "",
    imageUrl: e.parameter.imageUrl || ""
  };
}

function getUploadData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        imageBase64: postData.imageBase64,
        fileName: postData.fileName
      };
    } catch (error) {
      Logger.log("Parse upload data error: " + error.toString());
    }
  }
  
  return {
    imageBase64: e.parameter.imageBase64 || "",
    fileName: e.parameter.fileName || ""
  };
}

function getLikeData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        postId: postData.postId,
        type: postData.type
      };
    } catch (error) {
      Logger.log("Parse like data error: " + error.toString());
    }
  }
  
  return {
    postId: e.parameter.postId || "",
    type: e.parameter.type || ""
  };
}

function getDeletePostData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        postId: postData.postId,
        userId: postData.userId
      };
    } catch (error) {
      Logger.log("Parse delete post data error: " + error.toString());
    }
  }
  
  return {
    postId: e.parameter.postId || "",
    userId: e.parameter.userId || ""
  };
}

function getProfileData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        userId: postData.userId
      };
    } catch (error) {
      Logger.log("Parse profile data error: " + error.toString());
    }
  }
  
  return {
    userId: e.parameter.userId || ""
  };
}

function getUpdateProfileData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        userId: postData.userId,
        username: postData.username,
        nim: postData.nim,
        gender: postData.gender,
        jurusan: postData.jurusan
      };
    } catch (error) {
      Logger.log("Parse update profile data error: " + error.toString());
    }
  }
  
  return {
    userId: e.parameter.userId || "",
    username: e.parameter.username || "",
    nim: e.parameter.nim || "",
    gender: e.parameter.gender || "",
    jurusan: e.parameter.jurusan || ""
  };
}