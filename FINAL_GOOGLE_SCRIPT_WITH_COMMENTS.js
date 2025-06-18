/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - COMPLETE VERSION WITH UPDATE POST & COMMENTS
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET YANG BENAR:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 * Sheet "UserInteractions": idPostingan, idUsers, interactionType, timestamp
 * Sheet "Comments": idComment, idPostingan, idUsers, comment, timestamp
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
      case "updatePost":
        result = handleUpdatePost(e);
        break;
      case "likeDislike":
        result = handleLikeDislike(e);
        break;
      case "likePost":
        result = handleLikeDislike(e, "like");
        break;
      case "dislikePost":
        result = handleLikeDislike(e, "dislike");
        break;
      case "deletePost":
        result = handleDeletePost(e);
        break;
      case "getComments":
        result = handleGetComments(e);
        break;
      case "createComment":
        result = handleCreateComment(e);
        break;
      case "deleteComment":
        result = handleDeleteComment(e);
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
    message: "Connection successful - WITH COMMENTS SUPPORT",
    timestamp: new Date().toISOString(),
    status: "ok",
    methods_supported: ["GET", "POST"],
    cors_enabled: true,
    comment_support: true
  };
}

function handleLogin(e) {
  try {
    var credentials = getCredentials(e);
    var email = credentials.email;
    var password = credentials.password;

    Logger.log("Login attempt for: " + email);

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    // Struktur kolom: ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
    var ID_COL = 0, EMAIL_COL = 1, USERNAME_COL = 2, PASSWORD_COL = 3;
    var NIM_COL = 4, GENDER_COL = 5, JURUSAN_COL = 6, ROLE_COL = 7;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var userEmail = row[EMAIL_COL];
      var userPassword = row[PASSWORD_COL];
      
      if (userEmail && userEmail.toString().toLowerCase() === email.toLowerCase()) {
        if (userPassword.toString() === password.toString() || 
            verifyHashedPassword(password, userPassword.toString())) {
          
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

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      usersSheet = spreadsheet.insertSheet("Users");
      usersSheet.getRange(1, 1, 1, 9).setValues([[
        "ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "TimeStamp"
      ]]);
    }

    // Cek apakah email sudah ada
    var data = usersSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === userData.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    var newId = "USER_" + Date.now();
    var newRow = [
      newId, userData.email, userData.username, userData.password,
      userData.nim || "", userData.gender || "male", userData.jurusan || "",
      userData.role || "user", new Date()
    ];

    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      user: {
        idUsers: newId,
        username: userData.username,
        email: userData.email,
        role: userData.role || "user",
        nim: userData.nim || "",
        jurusan: userData.jurusan || ""
      }
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}

function verifyHashedPassword(plainPassword, hashedPassword) {
  if (hashedPassword.indexOf('$2') === 0) {
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

    var posts = [];
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      var post = {
        id: row[0] || "POST_" + i,
        idPostingan: row[0] || "POST_" + i,  
        userId: row[1] || "",
        idUsers: row[1] || "",
        judul: row[2] || "",
        deskripsi: row[3] || "",
        imageUrl: row[4] || "",
        timestamp: row[5] || new Date(),
        likes: parseInt(row[6] || 0),
        dislikes: parseInt(row[7] || 0),
        username: "User"
      };

      // Find username from Users sheet
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

    // Sort by timestamp descending (newest first)
    posts.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

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
      newId,                        // idPostingan
      postData.userId,              // idUsers
      postData.judul || "",         // judul
      postData.deskripsi,           // deskripsi
      postData.imageUrl || "",      // imageUrl
      new Date(),                   // timestamp
      0,                            // likeCount
      0                             // dislikeCount
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

function handleUpdatePost(e) {
  try {
    var updateData = getUpdatePostData(e);
    var postId = updateData.postId || updateData.idPostingan;
    var userId = updateData.userId;
    var judul = updateData.judul;
    var deskripsi = updateData.deskripsi;

    Logger.log("UPDATE POST - Received data: postId=" + postId + ", userId=" + userId);

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var data = postingSheet.getDataRange().getValues();
    var postFound = false;

    // Find the post row and update ONLY if user owns it
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        // Check if user owns the post OR is admin
        var userRole = getUserRole(userId);
        if (data[i][1] === userId || userRole === 'admin') {
          
          // Update ONLY the content, NOT the timestamp
          if (judul !== undefined && judul !== null) {
            postingSheet.getRange(i + 1, 3).setValue(judul);
          }
          if (deskripsi !== undefined && deskripsi !== null) {
            postingSheet.getRange(i + 1, 4).setValue(deskripsi);
          }
          
          // IMPORTANT: DO NOT UPDATE TIMESTAMP
          // postingSheet.getRange(i + 1, 6).setValue(new Date()); // <-- DO NOT DO THIS
          
          postFound = true;
          return {
            message: "Postingan berhasil diupdate",
            post: {
              id: postId,
              idPostingan: postId,
              userId: userId,
              judul: judul || data[i][2],
              deskripsi: deskripsi || data[i][3],
              timestamp: data[i][5], // Return original timestamp
              updated: true
            }
          };
        } else {
          return { error: "Anda tidak memiliki izin untuk mengedit postingan ini" };
        }
      }
    }

    if (!postFound) {
      return { error: "Postingan tidak ditemukan dengan ID: " + postId };
    }

  } catch (error) {
    Logger.log("Update post error: " + error.toString());
    return { error: "Error update postingan: " + error.toString() };
  }
}

function handleLikeDislike(e, forceType) {
  try {
    var likeData = getLikeData(e);
    var postId = likeData.postId;
    var userId = likeData.userId;
    var type = forceType || likeData.type || "like";

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var interactionsSheet = getOrCreateInteractionsSheet(spreadsheet);

    // Check existing interaction
    var existingRow = checkExistingInteraction(interactionsSheet, postId, userId);
    var existingType = null;
    
    if (existingRow > 0) {
      var interactions = interactionsSheet.getDataRange().getValues();
      existingType = interactions[existingRow - 1][2]; // interaction type column
      
      if (existingType === type) {
        return { error: "Anda sudah " + (type === "like" ? "like" : "dislike") + " postingan ini" };
      }
      
      // Update existing interaction
      updateExistingInteraction(interactionsSheet, postId, userId, type, existingRow);
    } else {
      // Record new interaction
      recordNewInteraction(interactionsSheet, postId, userId, type);
    }

    // Update post counts
    updatePostCounts(postingSheet, postId, type, existingType);
    
    // Get updated counts to return
    var updatedCounts = getUpdatedPostCounts(postingSheet, postId);
    
    return {
      message: "Berhasil " + type,
      likes: updatedCounts.likes,
      dislikes: updatedCounts.dislikes,
      success: true
    };

  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error " + (forceType || "like/dislike") + ": " + error.toString() };
  }
}

function getOrCreateInteractionsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("UserInteractions");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("UserInteractions");
    sheet.getRange(1, 1, 1, 4).setValues([["idPostingan", "idUsers", "interactionType", "timestamp"]]);
  }
  return sheet;
}

function checkExistingInteraction(interactionsSheet, postId, userId) {
  var data = interactionsSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId && data[i][1] === userId) {
      return i + 1; // Return 1-based row number
    }
  }
  return -1;
}

function updateExistingInteraction(interactionsSheet, postId, userId, newType, row) {
  interactionsSheet.getRange(row, 3).setValue(newType);
  interactionsSheet.getRange(row, 4).setValue(new Date());
}

function recordNewInteraction(interactionsSheet, postId, userId, type) {
  interactionsSheet.appendRow([postId, userId, type, new Date()]);
}

function updatePostCounts(postingSheet, postId, newType, oldType) {
  var data = postingSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      var likes = parseInt(data[i][6] || 0);
      var dislikes = parseInt(data[i][7] || 0);
      
      // Remove old interaction count
      if (oldType === "like") likes--;
      else if (oldType === "dislike") dislikes--;
      
      // Add new interaction count
      if (newType === "like") likes++;
      else if (newType === "dislike") dislikes++;
      
      // Ensure counts don't go below 0
      likes = Math.max(0, likes);
      dislikes = Math.max(0, dislikes);
      
      postingSheet.getRange(i + 1, 7).setValue(likes);
      postingSheet.getRange(i + 1, 8).setValue(dislikes);
      break;
    }
  }
}

function incrementPostCount(postingSheet, postId, type) {
  var data = postingSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      if (type === "like") {
        var currentLikes = parseInt(data[i][6] || 0);
        postingSheet.getRange(i + 1, 7).setValue(currentLikes + 1);
      } else if (type === "dislike") {
        var currentDislikes = parseInt(data[i][7] || 0);
        postingSheet.getRange(i + 1, 8).setValue(currentDislikes + 1);
      }
      break;
    }
  }
}

function getUpdatedPostCounts(postingSheet, postId) {
  var data = postingSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      return {
        likes: parseInt(data[i][6] || 0),
        dislikes: parseInt(data[i][7] || 0)
      };
    }
  }
  return { likes: 0, dislikes: 0 };
}

function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var data = postingSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        var userRole = getUserRole(userId);
        if (data[i][1] === userId || userRole === 'admin') {
          postingSheet.deleteRow(i + 1);
          
          // Delete related interactions and comments
          deletePostInteractions(spreadsheet, postId);
          deletePostComments(spreadsheet, postId);
          
          return { message: "Postingan berhasil dihapus" };
        } else {
          return { error: "Anda tidak memiliki izin untuk menghapus postingan ini" };
        }
      }
    }

    return { error: "Postingan tidak ditemukan" };

  } catch (error) {
    Logger.log("Delete post error: " + error.toString());
    return { error: "Error menghapus postingan: " + error.toString() };
  }
}

function deletePostInteractions(spreadsheet, postId) {
  try {
    var interactionsSheet = spreadsheet.getSheetByName("UserInteractions");
    if (interactionsSheet) {
      var data = interactionsSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === postId) {
          interactionsSheet.deleteRow(i + 1);
        }
      }
    }
  } catch (error) {
    Logger.log("Delete interactions error: " + error.toString());
  }
}

function deletePostComments(spreadsheet, postId) {
  try {
    var commentsSheet = spreadsheet.getSheetByName("Comments");
    if (commentsSheet) {
      var data = commentsSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][1] === postId) { // idPostingan is in column B (index 1)
          commentsSheet.deleteRow(i + 1);
        }
      }
    }
  } catch (error) {
    Logger.log("Delete comments error: " + error.toString());
  }
}

// COMMENT FUNCTIONS
function handleGetComments(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;
    
    Logger.log("Getting comments for post: " + postId);
    
    if (!postId) {
      return { error: "Post ID harus diisi" };
    }
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var commentsSheet = getOrCreateCommentsSheet(spreadsheet);
    var usersSheet = spreadsheet.getSheetByName("Users");
    
    var commentData = commentsSheet.getDataRange().getValues();
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];
    
    // Create user lookup map
    var userMap = {};
    for (var i = 1; i < userData.length; i++) {
      userMap[userData[i][0]] = userData[i][2] || "User";
    }
    
    var comments = [];
    if (commentData.length > 1) {
      for (var i = 1; i < commentData.length; i++) {
        var row = commentData[i];
        if (row[1] === postId) { // idPostingan column
          comments.push({
            idComment: row[0],
            idPostingan: row[1],
            idUsers: row[2],
            comment: row[3],
            timestamp: row[4],
            username: userMap[row[2]] || "User"
          });
        }
      }
    }
    
    // Sort by timestamp (oldest first for comments)
    comments.sort(function(a, b) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    Logger.log("Found " + comments.length + " comments for post " + postId);
    return comments;
    
  } catch (error) {
    Logger.log("Get comments error: " + error.toString());
    return [];
  }
}

function handleCreateComment(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;
    var userId = data.userId;
    var comment = data.comment;
    
    Logger.log("Creating comment: postId=" + postId + ", userId=" + userId + ", comment=" + comment);
    
    if (!postId || !userId || !comment) {
      return { error: "Post ID, User ID, dan comment harus diisi" };
    }
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var commentsSheet = getOrCreateCommentsSheet(spreadsheet);
    var newCommentId = "COMMENT_" + Date.now();
    var timestamp = new Date();
    
    commentsSheet.appendRow([newCommentId, postId, userId, comment, timestamp]);
    
    // Get username for response
    var usersSheet = spreadsheet.getSheetByName("Users");
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];
    var username = "User";
    
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) {
        username = userData[i][2] || "User";
        break;
      }
    }
    
    Logger.log("Comment created successfully: " + newCommentId);
    
    return {
      message: "Komentar berhasil dibuat",
      comment: {
        idComment: newCommentId,
        idPostingan: postId,
        idUsers: userId,
        comment: comment,
        timestamp: timestamp,
        username: username
      }
    };
    
  } catch (error) {
    Logger.log("Create comment error: " + error.toString());
    return { error: "Error membuat komentar: " + error.toString() };
  }
}

function handleDeleteComment(e) {
  try {
    var data = getCommentData(e);
    var commentId = data.commentId;
    var userId = data.userId;
    
    if (!commentId || !userId) {
      return { error: "Comment ID dan User ID harus diisi" };
    }
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var commentsSheet = getOrCreateCommentsSheet(spreadsheet);
    var commentData = commentsSheet.getDataRange().getValues();
    
    for (var i = 1; i < commentData.length; i++) {
      if (commentData[i][0] === commentId) {
        var commentOwner = commentData[i][2];
        var userRole = getUserRole(userId);
        
        if (commentOwner === userId || userRole === 'admin') {
          commentsSheet.deleteRow(i + 1);
          return { message: "Komentar berhasil dihapus" };
        } else {
          return { error: "Anda tidak memiliki izin untuk menghapus komentar ini" };
        }
      }
    }
    
    return { error: "Komentar tidak ditemukan" };
    
  } catch (error) {
    Logger.log("Delete comment error: " + error.toString());
    return { error: "Error menghapus komentar: " + error.toString() };
  }
}

function getOrCreateCommentsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("Comments");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Comments");
    sheet.getRange(1, 1, 1, 5).setValues([["idComment", "idPostingan", "idUsers", "comment", "timestamp"]]);
  }
  return sheet;
}

function getUserRole(userId) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");
    
    if (!usersSheet) return "user";
    
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return data[i][7] || "user"; // role column
      }
    }
    return "user";
  } catch (error) {
    return "user";
  }
}

function handleUploadImage(e) {
  try {
    var uploadData = getUploadData(e);
    
    if (!uploadData.base64Data || !uploadData.fileName) {
      return { error: "Data file dan nama file harus diisi" };
    }
    
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var blob = Utilities.newBlob(
      Utilities.base64Decode(uploadData.base64Data), 
      uploadData.mimeType || 'image/png', 
      uploadData.fileName
    );
    
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      message: "Gambar berhasil diupload",
      fileId: file.getId(),
      fileUrl: "https://drive.google.com/file/d/" + file.getId() + "/view"
    };
    
  } catch (error) {
    Logger.log("Upload image error: " + error.toString());
    return { error: "Error upload gambar: " + error.toString() };
  }
}

function handleGetProfile(e) {
  try {
    var profileData = getProfileData(e);
    var userId = profileData.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return {
          message: "Profile ditemukan",
          profile: {
            idUsers: data[i][0],
            email: data[i][1],
            username: data[i][2],
            nim: data[i][4] || "",
            gender: data[i][5] || "",
            jurusan: data[i][6] || "",
            role: data[i][7] || "user"
          }
        };
      }
    }

    return { error: "User tidak ditemukan" };

  } catch (error) {
    Logger.log("Get profile error: " + error.toString());
    return { error: "Error get profile: " + error.toString() };
  }
}

function handleUpdateProfile(e) {
  try {
    var updateData = getUpdateProfileData(e);
    var userId = updateData.userId;
    var username = updateData.username;
    var nim = updateData.nim;
    var gender = updateData.gender;
    var jurusan = updateData.jurusan;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        if (username !== undefined) {
          usersSheet.getRange(i + 1, 3).setValue(username);
        }
        if (nim !== undefined) {
          usersSheet.getRange(i + 1, 5).setValue(nim);
        }
        if (gender !== undefined) {
          usersSheet.getRange(i + 1, 6).setValue(gender);
        }
        if (jurusan !== undefined) {
          usersSheet.getRange(i + 1, 7).setValue(jurusan);
        }

        return {
          message: "Profile berhasil diupdate",
          profile: {
            idUsers: userId,
            username: username || data[i][2],
            nim: nim || data[i][4],
            gender: gender || data[i][5],
            jurusan: jurusan || data[i][6]
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
    var usersSheet = spreadsheet.getSheetByName("Users");
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var interactionsSheet = spreadsheet.getSheetByName("UserInteractions");
    var commentsSheet = spreadsheet.getSheetByName("Comments");
    
    return {
      totalUsers: usersSheet ? Math.max(0, usersSheet.getLastRow() - 1) : 0,
      totalPosts: postingSheet ? Math.max(0, postingSheet.getLastRow() - 1) : 0,
      totalInteractions: interactionsSheet ? Math.max(0, interactionsSheet.getLastRow() - 1) : 0,
      totalComments: commentsSheet ? Math.max(0, commentsSheet.getLastRow() - 1) : 0,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error get admin stats: " + error.toString() };
  }
}

// Helper functions for parsing request data
function getCredentials(e) {
  var credentials = {};
  if (e.parameter) {
    credentials.email = e.parameter.email;
    credentials.password = e.parameter.password;
  }
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      credentials.email = credentials.email || postData.email;
      credentials.password = credentials.password || postData.password;
    } catch (error) {}
  }
  return credentials;
}

function getUserData(e) {
  var userData = {};
  if (e.parameter) {
    userData = {
      email: e.parameter.email,
      username: e.parameter.username,
      password: e.parameter.password,
      nim: e.parameter.nim,
      gender: e.parameter.gender,
      jurusan: e.parameter.jurusan,
      role: e.parameter.role
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      Object.keys(postData).forEach(function(key) {
        userData[key] = userData[key] || postData[key];
      });
    } catch (error) {}
  }
  return userData;
}

function getPostData(e) {
  var postData = {};
  if (e.parameter) {
    postData = {
      userId: e.parameter.userId,
      judul: e.parameter.judul,
      deskripsi: e.parameter.deskripsi,
      imageUrl: e.parameter.imageUrl
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      Object.keys(data).forEach(function(key) {
        postData[key] = postData[key] || data[key];
      });
    } catch (error) {}
  }
  return postData;
}

function getUpdatePostData(e) {
  var updateData = {};
  if (e.parameter) {
    updateData = {
      postId: e.parameter.postId || e.parameter.idPostingan,
      userId: e.parameter.userId,
      judul: e.parameter.judul,
      deskripsi: e.parameter.deskripsi
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      updateData.postId = updateData.postId || data.postId || data.idPostingan;
      updateData.userId = updateData.userId || data.userId;
      updateData.judul = updateData.judul || data.judul;
      updateData.deskripsi = updateData.deskripsi || data.deskripsi;
    } catch (error) {}
  }
  return updateData;
}

function getLikeData(e) {
  var likeData = {};
  if (e.parameter) {
    likeData = {
      postId: e.parameter.postId,
      userId: e.parameter.userId,
      type: e.parameter.type
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      likeData.postId = likeData.postId || data.postId;
      likeData.userId = likeData.userId || data.userId;
      likeData.type = likeData.type || data.type;
    } catch (error) {}
  }
  return likeData;
}

function getCommentData(e) {
  var commentData = {};
  if (e.parameter) {
    commentData = {
      postId: e.parameter.postId,
      userId: e.parameter.userId,
      comment: e.parameter.comment,
      commentId: e.parameter.commentId
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      commentData.postId = commentData.postId || data.postId;
      commentData.userId = commentData.userId || data.userId;
      commentData.comment = commentData.comment || data.comment;
      commentData.commentId = commentData.commentId || data.commentId;
    } catch (error) {}
  }
  return commentData;
}

function getUploadData(e) {
  var uploadData = {};
  if (e.parameter) {
    uploadData = {
      base64Data: e.parameter.base64Data,
      fileName: e.parameter.fileName,
      mimeType: e.parameter.mimeType
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      uploadData.base64Data = uploadData.base64Data || data.base64Data;
      uploadData.fileName = uploadData.fileName || data.fileName;
      uploadData.mimeType = uploadData.mimeType || data.mimeType;
    } catch (error) {}
  }
  return uploadData;
}

function getDeletePostData(e) {
  var deleteData = {};
  if (e.parameter) {
    deleteData = {
      postId: e.parameter.postId,
      userId: e.parameter.userId
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      deleteData.postId = deleteData.postId || data.postId;
      deleteData.userId = deleteData.userId || data.userId;
    } catch (error) {}
  }
  return deleteData;
}

function getProfileData(e) {
  var profileData = {};
  if (e.parameter) {
    profileData = {
      userId: e.parameter.userId
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      profileData.userId = profileData.userId || data.userId;
    } catch (error) {}
  }
  return profileData;
}

function getUpdateProfileData(e) {
  var updateData = {};
  if (e.parameter) {
    updateData = {
      userId: e.parameter.userId,
      username: e.parameter.username,
      nim: e.parameter.nim,
      gender: e.parameter.gender,
      jurusan: e.parameter.jurusan
    };
  }
  if (e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      updateData.userId = updateData.userId || data.userId;
      updateData.username = updateData.username || data.username;
      updateData.nim = updateData.nim || data.nim;
      updateData.gender = updateData.gender || data.gender;
      updateData.jurusan = updateData.jurusan || data.jurusan;
    } catch (error) {}
  }
  return updateData;
}