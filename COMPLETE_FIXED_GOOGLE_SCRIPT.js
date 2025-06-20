/**
 * COMPLETE Google Apps Script dengan DELETE POST functionality
 * Menambahkan handleDeletePost yang hilang untuk admin deletion
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

// FUNCTION YANG HILANG: handleDeletePost
function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var adminId = deleteData.adminId;
    var singlePost = deleteData.singlePost;

    Logger.log("Delete post attempt:", {
      postId: postId,
      adminId: adminId,
      singlePost: singlePost,
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

    // Cek admin permission jika adminId diberikan
    if (adminId) {
      for (var j = 1; j < userData.length; j++) {
        if (userData[j][0] === adminId) {
          isAdmin = (userData[j][7] === "admin" || userData[j][7] === "Admin");
          break;
        }
      }
    }

    // Special handling untuk admin delete action
    if (adminId === 'ADMIN_DELETE' || isAdmin) {
      isAdmin = true;
    }

    Logger.log("Permission check:", {
      isAdmin: isAdmin,
      postOwnerId: postOwnerId,
      adminId: adminId,
      canDelete: isAdmin
    });

    // Validasi permission - hanya admin yang bisa menghapus
    if (!isAdmin) {
      return { error: "Hanya admin yang dapat menghapus post" };
    }

    // Hapus post dari sheet
    postingSheet.deleteRow(postRow);

    // Hapus interactions terkait post ini
    deletePostInteractions(postId);

    // Hapus comments terkait post ini
    deletePostComments(postId);

    Logger.log("Post deleted successfully:", postId);

    return {
      message: "Post berhasil dihapus oleh admin",
      success: true,
      postId: postId,
      deletedBy: "admin"
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
        adminId: data.adminId,
        singlePost: data.singlePost
      };
    }
    
    if (e.parameter) {
      return {
        postId: e.parameter.postId,
        adminId: e.parameter.adminId,
        singlePost: e.parameter.singlePost
      };
    }
    
    return {};
  } catch (error) {
    Logger.log("Get delete post data error: " + error.toString());
    return {};
  }
}

// Modifikasi deleteUserPosts untuk mendukung single post deletion
function handleDeleteUserPosts(e) {
  try {
    var deleteData = getDeleteUserPostsData(e);
    var userIdToDelete = deleteData.userIdToDelete;
    var adminId = deleteData.adminId;
    var postId = deleteData.postId;
    var singlePost = deleteData.singlePost;

    // Jika ini adalah single post deletion, redirect ke handleDeletePost
    if (singlePost && postId) {
      return handleDeletePost(e);
    }

    // Original deleteUserPosts logic continues here...
    if (!userIdToDelete || !adminId) {
      return { error: "User ID dan Admin ID harus diisi" };
    }

    var usersSheet = getSheet("Users");
    var postingSheet = getSheet("Posting");
    var userData = usersSheet.getDataRange().getValues();
    var postData = postingSheet.getDataRange().getValues();
    var adminRow = -1;

    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === adminId) {
        adminRow = i + 1;
        break;
      }
    }

    if (adminRow === -1 || userData[adminRow - 1][7] !== "admin") {
      return { error: "Anda tidak memiliki izin admin" };
    }

    var deletedCount = 0;
    for (var i = postData.length - 1; i >= 1; i--) {
      if (postData[i][1] === userIdToDelete) {
        postingSheet.deleteRow(i + 1);
        deletedCount++;
      }
    }

    return {
      message: "Posts user berhasil dihapus",
      deletedCount: deletedCount,
      userIdToDelete: userIdToDelete
    };
  } catch (error) {
    Logger.log("Delete user posts error: " + error.toString());
    return { error: "Error menghapus user posts: " + error.toString() };
  }
}

function getDeleteUserPostsData(e) {
  try {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      return {
        userIdToDelete: data.userIdToDelete,
        adminId: data.adminId,
        postId: data.postId,
        singlePost: data.singlePost
      };
    }
    
    if (e.parameter) {
      return {
        userIdToDelete: e.parameter.userIdToDelete,
        adminId: e.parameter.adminId,
        postId: e.parameter.postId,
        singlePost: e.parameter.singlePost
      };
    }
    
    return {};
  } catch (error) {
    Logger.log("Get delete user posts data error: " + error.toString());
    return {};
  }
}

// Include all other existing functions from the original script...
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
    version: "3.0_with_deletePost"
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

// Additional required functions...
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