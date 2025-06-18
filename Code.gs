/**
 * Google Apps Script untuk Platform Feedback Mahasiswa
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": ID Users, ID Postingan, timestamp, Judul, Deskripsi, Like, Dislike
 */

const GOOGLE_DRIVE_FOLDER_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw"; // ID folder Google Drive

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
    // Create response dengan CORS headers
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);
    
    // Set CORS headers untuk semua request
    response.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    
    // Handle preflight OPTIONS request
    if (e && e.method === "OPTIONS") {
      return response.setContent(JSON.stringify({ 
        status: "ok",
        message: "CORS preflight successful"
      }));
    }

    var action = getAction(e);
    Logger.log("Action: " + action);
    Logger.log("Method: " + e.method);

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
        result = handleGetPosts(e);
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
      case "uploadImage":
        result = handleUploadImage(e);
        break;
      case "getProfile":
        result = handleGetProfile(e);
        break;
      case "updateProfile":
        result = handleUpdateProfile(e);
        break;
      case "getAdminStats":
        result = handleGetAdminStats(e);
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
    errorResponse.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
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

function getData(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (parseError) {
      Logger.log("Parse error: " + parseError.toString());
    }
  }
  return e.parameter || {};
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
    var data = getData(e);
    var email = data.email;
    var password = data.password;

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var users = usersSheet.getDataRange().getValues();
    var headers = users[0];

    // Cari kolom
    var emailCol = headers.indexOf("Email");
    var passwordCol = headers.indexOf("Password");
    var idCol = headers.indexOf("ID Users");
    var usernameCol = headers.indexOf("Username");
    var roleCol = headers.indexOf("Role");
    var nimCol = headers.indexOf("NIM");
    var jurusanCol = headers.indexOf("Jurusan");
    var genderCol = headers.indexOf("Gender");

    // Cari user berdasarkan email
    for (var i = 1; i < users.length; i++) {
      var user = users[i];
      
      if (user[emailCol] && user[emailCol].toString().toLowerCase() === email.toLowerCase()) {
        // Cek password
        if (user[passwordCol] === password) {
          return {
            success: true,
            message: "Login berhasil",
            user: {
              id: user[idCol] || "USER" + Date.now(),
              username: user[usernameCol] || email.split('@')[0],
              email: email,
              role: user[roleCol] || "user",
              nim: user[nimCol] || "",
              jurusan: user[jurusanCol] || "",
              gender: user[genderCol] || "Male"
            }
          };
        } else {
          return { error: "Password salah" };
        }
      }
    }

    return { error: "Email tidak ditemukan" };

  } catch (error) {
    Logger.log("Login error: " + error.toString());
    return { error: "Error login: " + error.toString() };
  }
}

function handleRegister(e) {
  try {
    var data = getData(e);

    if (!data.email || !data.username || !data.password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      // Buat sheet Users jika belum ada
      usersSheet = spreadsheet.insertSheet("Users");
      usersSheet.getRange(1, 1, 1, 9).setValues([[
        "ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "TimeStamp"
      ]]);
    }

    // Cek apakah email sudah ada
    var users = usersSheet.getDataRange().getValues();
    var headers = users[0];
    var emailCol = headers.indexOf("Email");

    for (var i = 1; i < users.length; i++) {
      if (users[i][emailCol] === data.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    // Tambah user baru
    var newId = "USER" + Date.now();
    
    var newRow = [
      newId,                           // ID Users
      data.email,                      // Email
      data.username,                   // Username
      data.password,                   // Password
      data.nim || "",                  // NIM
      data.gender || "Male",           // Gender
      data.jurusan || "",              // Jurusan
      "user",                          // Role
      new Date().toISOString()         // TimeStamp
    ];

    usersSheet.appendRow(newRow);

    return {
      success: true,
      message: "Registrasi berhasil",
      user: {
        id: newId,
        username: data.username,
        email: data.email,
        role: "user",
        nim: data.nim || "",
        jurusan: data.jurusan || "",
        gender: data.gender || "Male"
      }
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}

function handleGetPosts(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!postingSheet) {
      // Buat sheet Posting jika belum ada
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 7).setValues([[
        "ID Users", "ID Postingan", "timestamp", "Judul", "Deskripsi", "Like", "Dislike"
      ]]);
      return { success: true, posts: [] };
    }

    var posts = postingSheet.getDataRange().getValues();
    var users = usersSheet ? usersSheet.getDataRange().getValues() : [];

    if (posts.length < 2) {
      return { success: true, posts: [] };
    }

    var postHeaders = posts[0];
    var userHeaders = users[0] || [];
    var result = [];

    // Mapping kolom posts
    var idUsersCol = postHeaders.indexOf("ID Users");
    var idPostinganCol = postHeaders.indexOf("ID Postingan");
    var timestampCol = postHeaders.indexOf("timestamp");
    var judulCol = postHeaders.indexOf("Judul");
    var deskripsiCol = postHeaders.indexOf("Deskripsi");
    var likeCol = postHeaders.indexOf("Like");
    var dislikeCol = postHeaders.indexOf("Dislike");

    // Mapping kolom users
    var userIdCol = userHeaders.indexOf("ID Users");
    var usernameCol = userHeaders.indexOf("Username");

    for (var i = 1; i < posts.length; i++) {
      var post = posts[i];
      var username = "Anonymous";

      // Cari username dari Users sheet
      if (users.length > 1 && post[idUsersCol]) {
        for (var j = 1; j < users.length; j++) {
          if (users[j][userIdCol] === post[idUsersCol]) {
            username = users[j][usernameCol] || "Anonymous";
            break;
          }
        }
      }

      result.push({
        id: post[idPostinganCol] || "POST" + i,
        userId: post[idUsersCol] || "",
        username: username,
        timestamp: post[timestampCol] || new Date(),
        judul: post[judulCol] || "",
        deskripsi: post[deskripsiCol] || "",
        likes: parseInt(post[likeCol] || 0),
        dislikes: parseInt(post[dislikeCol] || 0)
      });
    }

    // Sort berdasarkan timestamp terbaru
    result.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return { success: true, posts: result };

  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return { error: "Error mengambil posts: " + error.toString() };
  }
}

function handleCreatePost(e) {
  try {
    var data = getData(e);

    if (!data.userId || !data.deskripsi) {
      return { error: "User ID dan deskripsi harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      // Buat sheet Posting jika belum ada
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 7).setValues([[
        "ID Users", "ID Postingan", "timestamp", "Judul", "Deskripsi", "Like", "Dislike"
      ]]);
    }

    var newId = "POST" + Date.now();
    var newRow = [
      data.userId,                     // ID Users
      newId,                           // ID Postingan
      new Date().toISOString(),        // timestamp
      data.judul || "Post",            // Judul
      data.deskripsi,                  // Deskripsi
      0,                               // Like
      0                                // Dislike
    ];

    postingSheet.appendRow(newRow);

    return {
      success: true,
      message: "Post berhasil dibuat",
      postId: newId
    };

  } catch (error) {
    Logger.log("Create post error: " + error.toString());
    return { error: "Error membuat post: " + error.toString() };
  }
}

function handleLikePost(e) {
  try {
    var data = getData(e);
    var postId = data.postId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var posts = postingSheet.getDataRange().getValues();
    var headers = posts[0];
    var idPostinganCol = headers.indexOf("ID Postingan");
    var likeCol = headers.indexOf("Like");

    // Cari post berdasarkan ID
    for (var i = 1; i < posts.length; i++) {
      if (posts[i][idPostinganCol] === postId) {
        var currentLikes = parseInt(posts[i][likeCol] || 0);
        postingSheet.getRange(i + 1, likeCol + 1).setValue(currentLikes + 1);
        
        return {
          success: true,
          message: "Post berhasil di-like",
          newLikeCount: currentLikes + 1
        };
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Like post error: " + error.toString());
    return { error: "Error like post: " + error.toString() };
  }
}

function handleDislikePost(e) {
  try {
    var data = getData(e);
    var postId = data.postId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var posts = postingSheet.getDataRange().getValues();
    var headers = posts[0];
    var idPostinganCol = headers.indexOf("ID Postingan");
    var dislikeCol = headers.indexOf("Dislike");

    // Cari post berdasarkan ID
    for (var i = 1; i < posts.length; i++) {
      if (posts[i][idPostinganCol] === postId) {
        var currentDislikes = parseInt(posts[i][dislikeCol] || 0);
        postingSheet.getRange(i + 1, dislikeCol + 1).setValue(currentDislikes + 1);
        
        return {
          success: true,
          message: "Post berhasil di-dislike",
          newDislikeCount: currentDislikes + 1
        };
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Dislike post error: " + error.toString());
    return { error: "Error dislike post: " + error.toString() };
  }
}

function handleUploadImage(e) {
  try {
    var data = getData(e);
    var imageBase64 = data.imageBase64;
    var fileName = data.fileName || "image_" + Date.now() + ".png";

    if (!imageBase64) {
      return { error: "Data gambar harus diisi" };
    }

    // Decode base64
    var blob = Utilities.newBlob(
      Utilities.base64Decode(imageBase64.split(',')[1] || imageBase64),
      'image/png',
      fileName
    );

    // Upload ke Google Drive
    var folder = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID);
    var file = folder.createFile(blob);
    
    // Set file sebagai public
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var imageUrl = "https://drive.google.com/uc?id=" + file.getId();

    return {
      success: true,
      message: "Gambar berhasil di-upload",
      imageUrl: imageUrl,
      fileId: file.getId()
    };

  } catch (error) {
    Logger.log("Upload image error: " + error.toString());
    return { error: "Error upload gambar: " + error.toString() };
  }
}

function handleGetProfile(e) {
  try {
    var data = getData(e);
    var userId = data.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var users = usersSheet.getDataRange().getValues();
    var headers = users[0];
    var idCol = headers.indexOf("ID Users");

    // Cari user berdasarkan ID
    for (var i = 1; i < users.length; i++) {
      if (users[i][idCol] === userId) {
        return {
          success: true,
          user: {
            id: users[i][headers.indexOf("ID Users")],
            email: users[i][headers.indexOf("Email")],
            username: users[i][headers.indexOf("Username")],
            nim: users[i][headers.indexOf("NIM")],
            gender: users[i][headers.indexOf("Gender")],
            jurusan: users[i][headers.indexOf("Jurusan")],
            role: users[i][headers.indexOf("Role")]
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
    var data = getData(e);
    var userId = data.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var users = usersSheet.getDataRange().getValues();
    var headers = users[0];
    var idCol = headers.indexOf("ID Users");

    // Cari user berdasarkan ID
    for (var i = 1; i < users.length; i++) {
      if (users[i][idCol] === userId) {
        // Update data yang ada
        if (data.username) usersSheet.getRange(i + 1, headers.indexOf("Username") + 1).setValue(data.username);
        if (data.nim) usersSheet.getRange(i + 1, headers.indexOf("NIM") + 1).setValue(data.nim);
        if (data.jurusan) usersSheet.getRange(i + 1, headers.indexOf("Jurusan") + 1).setValue(data.jurusan);
        if (data.gender) usersSheet.getRange(i + 1, headers.indexOf("Gender") + 1).setValue(data.gender);

        return {
          success: true,
          message: "Profile berhasil diupdate"
        };
      }
    }

    return { error: "User tidak ditemukan" };

  } catch (error) {
    Logger.log("Update profile error: " + error.toString());
    return { error: "Error update profile: " + error.toString() };
  }
}

function handleGetAdminStats(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!postingSheet || !usersSheet) {
      return { error: "Sheet tidak ditemukan" };
    }

    var posts = postingSheet.getDataRange().getValues();
    var users = usersSheet.getDataRange().getValues();

    if (posts.length < 2) {
      return { 
        success: true, 
        stats: {
          totalPosts: 0,
          totalUsers: users.length - 1,
          topPosts: []
        }
      };
    }

    var postHeaders = posts[0];
    var userHeaders = users[0];
    var topPosts = [];

    // Mapping kolom
    var idUsersCol = postHeaders.indexOf("ID Users");
    var idPostinganCol = postHeaders.indexOf("ID Postingan");
    var deskripsiCol = postHeaders.indexOf("Deskripsi");
    var likeCol = postHeaders.indexOf("Like");
    var timestampCol = postHeaders.indexOf("timestamp");

    var userIdCol = userHeaders.indexOf("ID Users");
    var usernameCol = userHeaders.indexOf("Username");

    // Ambil semua posts dengan likes
    for (var i = 1; i < posts.length; i++) {
      var post = posts[i];
      var username = "Anonymous";

      // Cari username
      for (var j = 1; j < users.length; j++) {
        if (users[j][userIdCol] === post[idUsersCol]) {
          username = users[j][usernameCol] || "Anonymous";
          break;
        }
      }

      topPosts.push({
        id: post[idPostinganCol],
        username: username,
        deskripsi: post[deskripsiCol],
        likes: parseInt(post[likeCol] || 0),
        timestamp: post[timestampCol]
      });
    }

    // Sort berdasarkan likes terbanyak
    topPosts.sort(function(a, b) {
      return b.likes - a.likes;
    });

    // Ambil top 10
    topPosts = topPosts.slice(0, 10);

    return {
      success: true,
      stats: {
        totalPosts: posts.length - 1,
        totalUsers: users.length - 1,
        topPosts: topPosts
      }
    };

  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error mengambil statistik: " + error.toString() };
  }
}