/**
 * COMPLETE Google Apps Script dengan DELETE POST functionality
 * Berdasarkan script minimal fix + menambahkan handleDeletePost yang hilang
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp, LastProfileUpdate
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 * Sheet "UserInteractions": idPostingan, idUsers, interactionType, timestamp
 * Sheet "Comments": idComment, idPostingan, idUsers, comment, timestamp
 * Sheet "Notifications": idNotification, idUsers, message, timestamp, isRead
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
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setContent(JSON.stringify({ 
    status: "ok",
    message: "CORS preflight successful"
  }));
  return response;
}

function handleRequest(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);

  try {
    var action = getAction(e);
    Logger.log("=== REQUEST START ===");
    Logger.log("Action: " + action);
    Logger.log("Method: " + (e.parameter ? "GET" : "POST"));
    
    if (e.postData) {
      Logger.log("POST Data: " + e.postData.contents);
    }
    if (e.parameter) {
      Logger.log("GET Parameters: " + JSON.stringify(e.parameter));
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
        result = handleGetPosts(e);
        break;
      case "createPost":
        result = handleCreatePost(e);
        break;
      case "updatePost":
        result = handleUpdatePost(e);
        break;
      case "deletePost":
        result = handleDeletePost(e);
        break;
      case "likePost":
        result = handleLikePost(e);
        break;
      case "createComment":
        result = handleCreateComment(e);
        break;
      case "getComments":
        result = handleGetComments(e);
        break;
      case "deleteComment":
        result = handleDeleteComment(e);
        break;
      case "uploadImage":
        result = handleUploadImage(e);
        break;
      case "updateProfile":
        result = handleUpdateProfile(e);
        break;
      case "getUserPosts":
        result = handleGetUserPosts(e);
        break;
      case "search":
        result = handleSearch(e);
        break;
      case "getNotifications":
        result = handleGetNotifications(e);
        break;
      case "getAdminStats":
        result = handleGetAdminStats(e);
        break;
      case "deleteUser":
        result = handleDeleteUser(e);
        break;
      case "deleteUserPosts":
        result = handleDeleteUserPosts(e);
        break;
      default:
        result = { error: "Action tidak dikenal: " + action };
    }

    Logger.log("Result: " + JSON.stringify(result));
    Logger.log("=== REQUEST END ===");
    
    response.setContent(JSON.stringify(result));
    return response;

  } catch (error) {
    Logger.log("FATAL ERROR in handleRequest: " + error.toString());
    Logger.log("Error stack: " + error.stack);
    
    var errorResponse = ContentService.createTextOutput();
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    errorResponse.setContent(JSON.stringify({ 
      error: "Server error: " + error.toString(),
      timestamp: new Date().toISOString(),
      action: getAction(e)
    }));
    return errorResponse;
  }
}

function getAction(e) {
  try {
    if (e && e.parameter && e.parameter.action) {
      Logger.log("Action from GET parameter: " + e.parameter.action);
      return e.parameter.action;
    }
    if (e && e.postData && e.postData.contents) {
      try {
        var postData = JSON.parse(e.postData.contents);
        Logger.log("Action from POST data: " + (postData.action || "test"));
        return postData.action || "test";
      } catch (parseError) {
        Logger.log("Parse error in getAction: " + parseError.toString());
        return "test";
      }
    }
    Logger.log("No action found, defaulting to test");
    return "test";
  } catch (error) {
    Logger.log("Error in getAction: " + error.toString());
    return "test";
  }
}

function testConnection() {
  return {
    message: "Connection successful",
    timestamp: new Date().toISOString(),
    status: "ok",
    methods_supported: ["GET", "POST"],
    cors_enabled: true,
    version: "2.1_with_deletePost"
  };
}

function getSheet(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = createSheet(spreadsheet, sheetName);
  }
  
  return sheet;
}

function createSheet(spreadsheet, sheetName) {
  var sheet = spreadsheet.insertSheet(sheetName);
  
  switch(sheetName) {
    case "Users":
      sheet.getRange(1, 1, 1, 10).setValues([[
        "ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "TimeStamp", "LastProfileUpdate"
      ]]);
      break;
    case "Posting":
      sheet.getRange(1, 1, 1, 8).setValues([[
        "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
      ]]);
      break;
    case "UserInteractions":
      sheet.getRange(1, 1, 1, 4).setValues([[
        "idPostingan", "idUsers", "interactionType", "timestamp"
      ]]);
      break;
    case "Comments":
      sheet.getRange(1, 1, 1, 5).setValues([[
        "idComment", "idPostingan", "idUsers", "comment", "timestamp"
      ]]);
      break;
    case "Notifications":
      sheet.getRange(1, 1, 1, 5).setValues([[
        "idNotification", "idUsers", "message", "timestamp", "isRead"
      ]]);
      break;
  }
  
  return sheet;
}

// FUNCTION YANG HILANG: handleDeletePost
function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId || deleteData.adminId;

    Logger.log("Delete post attempt:", {
      postId: postId,
      userId: userId,
      deleteData: deleteData
    });

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");
    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    var postRow = -1;
    var postOwnerId = null;
    var userRow = -1;
    var isAdmin = false;

    // Cari post yang akan dihapus
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        postRow = i + 1;
        postOwnerId = postData[i][1];
        break;
      }
    }

    if (postRow === -1) {
      return { error: "Post tidak ditemukan" };
    }

    // Cek apakah user adalah admin atau pemilik post
    for (var j = 1; j < userData.length; j++) {
      if (userData[j][0] === userId) {
        userRow = j + 1;
        isAdmin = (userData[j][7] === "admin" || userData[j][7] === "Admin");
        break;
      }
    }

    Logger.log("Permission check:", {
      isAdmin: isAdmin,
      postOwnerId: postOwnerId,
      userId: userId,
      canDelete: (isAdmin || postOwnerId === userId)
    });

    // Validasi permission
    if (!isAdmin && postOwnerId !== userId) {
      return { error: "Anda tidak memiliki izin untuk menghapus post ini" };
    }

    // Hapus post dari sheet
    postingSheet.deleteRow(postRow);

    // Hapus interactions terkait post ini
    deletePostInteractions(postId);

    // Hapus comments terkait post ini
    deletePostComments(postId);

    Logger.log("Post deleted successfully:", postId);

    return {
      message: isAdmin ? "Post berhasil dihapus oleh admin" : "Post berhasil dihapus",
      success: true,
      postId: postId,
      deletedBy: isAdmin ? "admin" : "owner"
    };

  } catch (error) {
    Logger.log("Delete post error: " + error.toString());
    return { error: "Error menghapus post: " + error.toString() };
  }
}

// Function untuk menghapus interactions terkait post
function deletePostInteractions(postId) {
  try {
    var interactionsSheet = getSheet("UserInteractions");
    var interactionData = interactionsSheet.getDataRange().getValues();
    
    // Hapus dari bawah ke atas untuk menghindari perubahan index
    for (var i = interactionData.length - 1; i >= 1; i--) {
      if (interactionData[i][0] === postId) {
        interactionsSheet.deleteRow(i + 1);
      }
    }
    Logger.log("Deleted interactions for post:", postId);
  } catch (error) {
    Logger.log("Delete post interactions error: " + error.toString());
  }
}

// Function untuk menghapus comments terkait post
function deletePostComments(postId) {
  try {
    var commentsSheet = getSheet("Comments");
    var commentData = commentsSheet.getDataRange().getValues();
    
    // Hapus dari bawah ke atas untuk menghindari perubahan index
    for (var i = commentData.length - 1; i >= 1; i--) {
      if (commentData[i][1] === postId) {
        commentsSheet.deleteRow(i + 1);
      }
    }
    Logger.log("Deleted comments for post:", postId);
  } catch (error) {
    Logger.log("Delete post comments error: " + error.toString());
  }
}

// Function untuk mendapatkan data delete post
function getDeletePostData(e) {
  try {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      return {
        postId: data.postId,
        userId: data.userId,
        adminId: data.adminId
      };
    }
    
    if (e.parameter) {
      return {
        postId: e.parameter.postId,
        userId: e.parameter.userId,
        adminId: e.parameter.adminId
      };
    }
    
    return {};
  } catch (error) {
    Logger.log("Get delete post data error: " + error.toString());
    return {};
  }
}

// Sisanya tetap sama seperti script asli...
function handleLogin(e) {
  try {
    var credentials = getCredentials(e);
    var email = credentials.email;
    var password = credentials.password;

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var usersSheet = getSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[1].toString().toLowerCase() === email.toLowerCase()) {
        if (row[3].toString() === password.toString()) {
          return {
            message: "Login berhasil",
            user: {
              idUsers: row[0],
              username: row[2],
              email: row[1],
              role: row[7],
              redirect: row[7] === "user" ? "/dashboard" : "/admin"
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

function getCredentials(e) {
  try {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      return {
        email: data.email,
        password: data.password
      };
    }
    
    if (e.parameter) {
      return {
        email: e.parameter.email,
        password: e.parameter.password
      };
    }
    
    return {};
  } catch (error) {
    Logger.log("Get credentials error: " + error.toString());
    return {};
  }
}

// Tambahkan semua function lainnya sesuai script asli...
// (Untuk menghemat space, saya hanya menampilkan function utama yang diperlukan)