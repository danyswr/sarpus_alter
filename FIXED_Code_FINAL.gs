/**
 * FIXED Google Apps Script untuk Mahasiswa Feedback Platform
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
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
    version: "2.0"
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

function handleRegister(e) {
  try {
    var userData = getUserData(e);
    if (!userData.email || !userData.username || !userData.password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    var usersSheet = getSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === userData.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    var newId = "USER_" + Date.now();
    var newRow = [
      newId,
      userData.email,
      userData.username,
      userData.password,
      userData.nim || "",
      userData.gender || "male",
      userData.jurusan || "",
      "user",
      new Date(),
      ""
    ];
    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      user: {
        idUsers: newId,
        username: userData.username,
        email: userData.email,
        role: "user",
        redirect: "/dashboard"
      }
    };
  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}

function handleGetPosts(e) {
  try {
    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");
    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    if (postData.length < 2) return [];

    var posts = [];
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      if (!row[0] || row[0] === '') continue;
      
      var post = {
        id: row[0],
        idPostingan: row[0],
        userId: row[1],
        judul: row[2] || "",
        deskripsi: row[3] || "",
        imageUrl: row[4] || "",
        timestamp: row[5] || new Date(),
        likes: parseInt(row[6] || 0),
        dislikes: parseInt(row[7] || 0),
        username: "User"
      };

      if (userData.length > 1 && post.userId) {
        for (var j = 1; j < userData.length; j++) {
          if (userData[j][0] === post.userId) {
            post.username = userData[j][2] || "User";
            break;
          }
        }
      }
      posts.push(post);
    }
    posts.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    return posts;
  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return { error: "Error mengambil postingan: " + error.toString() };
  }
}

function handleCreatePost(e) {
  try {
    var postData = getPostData(e);
    if (!postData.userId || !postData.deskripsi) {
      return { error: "userId dan deskripsi harus diisi" };
    }

    var postingSheet = getSheet("Posting");
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

function handleLikePost(e) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;
    var userId = data.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var interactionsSheet = getSheet("UserInteractions");
    var postData = postingSheet.getDataRange().getValues();
    var interactionData = interactionsSheet.getDataRange().getValues();
    var postRow = -1;
    var existingInteraction = false;

    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        postRow = i + 1;
        break;
      }
    }

    if (postRow === -1) return { error: "Postingan tidak ditemukan" };

    for (var i = 1; i < interactionData.length; i++) {
      if (interactionData[i][0] === postId && interactionData[i][1] === userId) {
        existingInteraction = true;
        break;
      }
    }

    if (!existingInteraction) {
      var currentLikes = parseInt(postData[postRow - 1][6] || 0);
      postingSheet.getRange(postRow, 7).setValue(currentLikes + 1);
      interactionsSheet.appendRow([postId, userId, "like", new Date()]);
      return {
        message: "Like berhasil ditambahkan",
        likes: currentLikes + 1
      };
    }
    return { error: "Anda sudah menyukai postingan ini" };
  } catch (error) {
    Logger.log("Like post error: " + error.toString());
    return { error: "Error like postingan: " + error.toString() };
  }
}

function handleCreateComment(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;
    var userId = data.userId;
    var comment = data.comment;

    if (!postId || !userId || !comment || comment.trim() === "") {
      return { error: "Post ID, User ID, dan komentar harus diisi" };
    }

    var commentsSheet = getSheet("Comments");
    var newId = "COMMENT_" + Date.now();
    commentsSheet.appendRow([newId, postId, userId, comment.trim(), new Date()]);

    return {
      message: "Komentar berhasil dibuat",
      comment: {
        id: newId,
        idComment: newId,
        idPostingan: postId,
        userId: userId,
        comment: comment.trim(),
        timestamp: new Date()
      }
    };
  } catch (error) {
    Logger.log("Create comment error: " + error.toString());
    return { error: "Error membuat komentar: " + error.toString() };
  }
}

function handleGetComments(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var commentsSheet = getSheet("Comments");
    var commentsData = commentsSheet.getDataRange().getValues();
    var comments = [];

    for (var i = 1; i < commentsData.length; i++) {
      var row = commentsData[i];
      if (row[1] === postId) {
        comments.push({
          id: row[0],
          idComment: row[0],
          idPostingan: row[1],
          userId: row[2],
          comment: row[3],
          timestamp: row[4]
        });
      }
    }

    return comments;
  } catch (error) {
    Logger.log("Get comments error: " + error.toString());
    return { error: "Error mengambil komentar: " + error.toString() };
  }
}

// Helper functions
function getCredentials(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      return e.parameter || {};
    }
  }
  return e.parameter || {};
}

function getUserData(e) {
  return getCredentials(e);
}

function getPostData(e) {
  return getCredentials(e);
}

function getLikeData(e) {
  return getCredentials(e);
}

function getCommentData(e) {
  return getCredentials(e);
}