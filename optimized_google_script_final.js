/**
 * OPTIMIZED Google Apps Script untuk Mahasiswa Feedback Platform WITH COMMENTS - FINAL VERSION
 * Includes comment functionality and performance optimizations
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 * Sheet "UserInteractions": idPostingan, idUsers, interactionType, timestamp
 * Sheet "Comments": idComment, idPostingan, idUsers, comment, timestamp
 */

var DRIVE_FOLDER_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function doOptions(e) {
  return createCorsResponse({ status: "ok", message: "CORS preflight successful" });
}

function handleRequest(e) {
  try {
    if (e.method === "OPTIONS") {
      return createCorsResponse({ status: "ok", message: "CORS preflight successful" });
    }

    var action = getAction(e);
    Logger.log("Action received: " + action);
    
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
      case "likePost":
      case "dislikePost":
        result = handleLikeDislike(e);
        break;
      case "deletePost":
        result = handleDeletePost(e);
        break;
      case "uploadImage":
        result = handleUploadImage(e);
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
      case "getAdminStats":
        result = handleGetAdminStats();
        break;
      default:
        result = { error: "Action tidak dikenal: " + action };
    }

    return createCorsResponse(result);

  } catch (error) {
    Logger.log("Error in handleRequest: " + error.toString());
    return createCorsResponse({ 
      error: "Server error: " + error.toString(),
      timestamp: new Date().toISOString()
    });
  }
}

function createCorsResponse(data) {
  var response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  return response;
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
    message: "Connection successful - OPTIMIZED WITH COMMENTS",
    timestamp: new Date().toISOString(),
    status: "ok",
    features: ["posts", "comments", "likes", "upload", "optimized"],
    performance: "enhanced"
  };
}

function getOrCreateSheet(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    switch(sheetName) {
      case "Users":
        sheet.getRange(1, 1, 1, 9).setValues([[
          "ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "TimeStamp"
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
    }
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

    var usersSheet = getOrCreateSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[1] && row[1].toString().toLowerCase() === email.toLowerCase()) {
        if (row[3].toString() === password.toString()) {
          return {
            message: "Login berhasil",
            user: {
              idUsers: row[0] || "USER_" + i,
              username: row[2] || email.split('@')[0],
              email: email,
              role: row[7] || "user",
              nim: row[4] || "",
              jurusan: row[6] || "",
              gender: row[5] || ""
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

    var usersSheet = getOrCreateSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    // Check if email exists
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

function handleGetPosts() {
  try {
    var postingSheet = getOrCreateSheet("Posting");
    var usersSheet = getOrCreateSheet("Users");
    
    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    if (postData.length < 2) {
      return [];
    }
    
    // Create user lookup map for O(1) access
    var userMap = {};
    for (var i = 1; i < userData.length; i++) {
      userMap[userData[i][0]] = userData[i][2] || "User";
    }
    
    var posts = [];
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      posts.push({
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
        username: userMap[row[1]] || "User"
      });
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

    var postingSheet = getOrCreateSheet("Posting");
    var newId = "POST_" + Date.now();
    var timestamp = new Date();
    
    var newRow = [
      newId, postData.userId, postData.judul || "", postData.deskripsi,
      postData.imageUrl || "", timestamp, 0, 0
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
        timestamp: timestamp,
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

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getOrCreateSheet("Posting");
    var data = postingSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId && data[i][1] === userId) {
        if (judul !== undefined) {
          postingSheet.getRange(i + 1, 3).setValue(judul);
        }
        if (deskripsi !== undefined) {
          postingSheet.getRange(i + 1, 4).setValue(deskripsi);
        }
        // TIDAK UPDATE TIMESTAMP - tetap preserve waktu posting asli
        
        return {
          message: "Postingan berhasil diupdate",
          post: {
            id: postId,
            judul: judul,
            deskripsi: deskripsi,
            updated: true
          }
        };
      }
    }

    return { error: "Postingan tidak ditemukan atau Anda tidak memiliki izin" };

  } catch (error) {
    Logger.log("Update post error: " + error.toString());
    return { error: "Error update postingan: " + error.toString() };
  }
}

function handleLikeDislike(e) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;
    var userId = data.userId;
    var type = data.type || "like";
    
    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }
    
    var postingSheet = getOrCreateSheet("Posting");
    var interactionsSheet = getOrCreateSheet("UserInteractions");
    
    // Check existing interaction
    var interactions = interactionsSheet.getDataRange().getValues();
    var existingRow = -1;
    var existingType = null;
    
    for (var i = 1; i < interactions.length; i++) {
      if (interactions[i][0] === postId && interactions[i][1] === userId) {
        existingRow = i + 1;
        existingType = interactions[i][2];
        break;
      }
    }
    
    var posts = postingSheet.getDataRange().getValues();
    var postRow = -1;
    
    for (var j = 1; j < posts.length; j++) {
      if (posts[j][0] === postId) {
        postRow = j + 1;
        break;
      }
    }
    
    if (postRow === -1) {
      return { error: "Post tidak ditemukan" };
    }
    
    var currentLikes = parseInt(posts[postRow - 1][6] || 0);
    var currentDislikes = parseInt(posts[postRow - 1][7] || 0);
    
    if (existingRow > 0) {
      if (existingType === type) {
        return { error: "Anda sudah " + (type === "like" ? "like" : "dislike") + " postingan ini" };
      }
      
      // Switch interaction type
      interactionsSheet.getRange(existingRow, 3).setValue(type);
      interactionsSheet.getRange(existingRow, 4).setValue(new Date());
      
      // Update counts
      if (existingType === "like") currentLikes--;
      else currentDislikes--;
      
      if (type === "like") currentLikes++;
      else currentDislikes++;
      
    } else {
      // New interaction
      interactionsSheet.appendRow([postId, userId, type, new Date()]);
      
      if (type === "like") currentLikes++;
      else currentDislikes++;
    }
    
    // Update post counts
    postingSheet.getRange(postRow, 7).setValue(currentLikes);
    postingSheet.getRange(postRow, 8).setValue(currentDislikes);
    
    return {
      message: "Berhasil " + type,
      likes: currentLikes,
      dislikes: currentDislikes,
      success: true
    };
    
  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error " + (data.type || "like/dislike") + ": " + error.toString() };
  }
}

function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getOrCreateSheet("Posting");
    var data = postingSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        var userRole = getUserRole(userId);
        if (data[i][1] === userId || userRole === 'admin') {
          postingSheet.deleteRow(i + 1);
          
          // Delete related interactions and comments
          deletePostInteractions(postId);
          deletePostComments(postId);
          
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

// COMMENT FUNCTIONS
function handleGetComments(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;
    
    Logger.log("Getting comments for post: " + postId);
    
    if (!postId) {
      return { error: "Post ID harus diisi" };
    }
    
    var commentsSheet = getOrCreateSheet("Comments");
    var usersSheet = getOrCreateSheet("Users");
    
    var commentData = commentsSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    // Create user lookup map
    var userMap = {};
    for (var i = 1; i < userData.length; i++) {
      userMap[userData[i][0]] = userData[i][2] || "User";
    }
    
    var comments = [];
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
    
    var commentsSheet = getOrCreateSheet("Comments");
    var newCommentId = "COMMENT_" + Date.now();
    var timestamp = new Date();
    
    commentsSheet.appendRow([newCommentId, postId, userId, comment, timestamp]);
    
    // Get username for response
    var usersSheet = getOrCreateSheet("Users");
    var userData = usersSheet.getDataRange().getValues();
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
    
    var commentsSheet = getOrCreateSheet("Comments");
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

function deletePostInteractions(postId) {
  try {
    var interactionsSheet = getOrCreateSheet("UserInteractions");
    var data = interactionsSheet.getDataRange().getValues();
    
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === postId) {
        interactionsSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    Logger.log("Delete interactions error: " + error.toString());
  }
}

function deletePostComments(postId) {
  try {
    var commentsSheet = getOrCreateSheet("Comments");
    var data = commentsSheet.getDataRange().getValues();
    
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === postId) {
        commentsSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    Logger.log("Delete comments error: " + error.toString());
  }
}

function getUserRole(userId) {
  try {
    var usersSheet = getOrCreateSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return data[i][7] || "user";
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

function handleGetAdminStats() {
  try {
    var usersSheet = getOrCreateSheet("Users");
    var postingSheet = getOrCreateSheet("Posting");
    var interactionsSheet = getOrCreateSheet("UserInteractions");
    var commentsSheet = getOrCreateSheet("Comments");
    
    return {
      totalUsers: Math.max(0, usersSheet.getLastRow() - 1),
      totalPosts: Math.max(0, postingSheet.getLastRow() - 1),
      totalInteractions: Math.max(0, interactionsSheet.getLastRow() - 1),
      totalComments: Math.max(0, commentsSheet.getLastRow() - 1),
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