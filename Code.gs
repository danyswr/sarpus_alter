/**
 * FIXED Google Apps Script untuk Mahasiswa Feedback Platform
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
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
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setContent(JSON.stringify({ 
    status: "ok",
    message: "CORS preflight successful"
  }));
  return response;
}

function handleRequest(e) {
  try {
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

    var action = getAction(e);
    Logger.log("Action: " + action);
    
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
  // Try parameter first (for GET requests)
  if (e && e.parameter && e.parameter.action) {
    return e.parameter.action;
  }

  // Try POST data
  if (e && e.postData && e.postData.contents) {
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
  
  return sheet;
}

function handleGetPosts() {
  try {
    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");
    
    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    if (postData.length < 2) {
      return [];
    }

    var posts = [];
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      
      // Skip empty rows
      if (!row[0] || row[0] === '') continue;
      
      var post = {
        id: row[0],
        idPostingan: row[0],  
        userId: row[1],
        idUsers: row[1],
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

    // Sort by timestamp (newest first)
    posts.sort(function(a, b) {
      var dateA = new Date(a.timestamp).getTime();
      var dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    Logger.log("Returning " + posts.length + " posts");
    return posts;

  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return { error: "Error mengambil postingan: " + error.toString() };
  }
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

    var usersSheet = getSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    // Check each user
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var userEmail = row[1];
      var userPassword = row[3];
      
      if (userEmail && userEmail.toString().toLowerCase() === email.toLowerCase()) {
        if (userPassword && userPassword.toString() === password.toString()) {
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

    var usersSheet = getSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    // Check if email already exists
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
      userData.role || "user",
      new Date()
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

function handleLikeDislike(e) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;
    var userId = data.userId;
    var type = data.type || "like";

    Logger.log("Processing like/dislike: " + JSON.stringify(data));

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var interactionsSheet = getSheet("UserInteractions");
    
    var postData = postingSheet.getDataRange().getValues();
    var postRow = -1;
    
    // Find post
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        postRow = i + 1;
        break;
      }
    }
    
    if (postRow === -1) {
      return { error: "Postingan tidak ditemukan" };
    }

    // Check existing interaction
    var interactionData = interactionsSheet.getDataRange().getValues();
    var existingRow = -1;
    var existingType = null;
    
    for (var i = 1; i < interactionData.length; i++) {
      if (interactionData[i][0] === postId && interactionData[i][1] === userId) {
        existingRow = i + 1;
        existingType = interactionData[i][2];
        break;
      }
    }
    
    var currentLikes = parseInt(postData[postRow - 1][6] || 0);
    var currentDislikes = parseInt(postData[postRow - 1][7] || 0);
    var newLikes = currentLikes;
    var newDislikes = currentDislikes;
    
    if (existingRow !== -1) {
      // Update existing interaction
      if (existingType === type) {
        // Remove interaction
        interactionsSheet.deleteRow(existingRow);
        if (type === "like") {
          newLikes = Math.max(0, currentLikes - 1);
        } else {
          newDislikes = Math.max(0, currentDislikes - 1);
        }
      } else {
        // Change interaction type
        interactionsSheet.getRange(existingRow, 3).setValue(type);
        interactionsSheet.getRange(existingRow, 4).setValue(new Date());
        if (type === "like") {
          newLikes = currentLikes + 1;
          newDislikes = Math.max(0, currentDislikes - 1);
        } else {
          newDislikes = currentDislikes + 1;
          newLikes = Math.max(0, currentLikes - 1);
        }
      }
    } else {
      // Add new interaction
      interactionsSheet.appendRow([postId, userId, type, new Date()]);
      if (type === "like") {
        newLikes = currentLikes + 1;
      } else {
        newDislikes = currentDislikes + 1;
      }
    }
    
    // Update post counts
    postingSheet.getRange(postRow, 7).setValue(newLikes);
    postingSheet.getRange(postRow, 8).setValue(newDislikes);
    
    return {
      message: "Interaksi berhasil diupdate",
      likes: newLikes,
      dislikes: newDislikes,
      newLikeCount: newLikes,
      newDislikeCount: newDislikes
    };

  } catch (error) {
    Logger.log("Like/dislike error: " + error.toString());
    return { error: "Error like/dislike: " + error.toString() };
  }
}

function handleGetComments(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;
    
    Logger.log("Getting comments for post: " + postId);
    
    if (!postId) {
      return { error: "Post ID harus diisi" };
    }
    
    var commentsSheet = getSheet("Comments");
    var usersSheet = getSheet("Users");
    
    var commentData = commentsSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    if (commentData.length < 2) {
      return [];
    }
    
    var comments = [];
    for (var i = 1; i < commentData.length; i++) {
      var row = commentData[i];
      if (row[1] === postId) { // Check if comment belongs to this post
        var comment = {
          id: row[0],
          idComment: row[0],
          idPostingan: row[1],
          userId: row[2],
          idUsers: row[2],
          comment: row[3],
          commentText: row[3],
          timestamp: row[4] || new Date(),
          username: "User"
        };
        
        // Find username
        if (userData.length > 1 && comment.userId) {
          for (var j = 1; j < userData.length; j++) {
            if (userData[j][0] === comment.userId) {
              comment.username = userData[j][2] || "User";
              break;
            }
          }
        }
        
        comments.push(comment);
      }
    }
    
    // Sort comments by timestamp (oldest first)
    comments.sort(function(a, b) {
      var dateA = new Date(a.timestamp).getTime();
      var dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });
    
    return comments;
    
  } catch (error) {
    Logger.log("Get comments error: " + error.toString());
    return { error: "Error mengambil komentar: " + error.toString() };
  }
}

function handleCreateComment(e) {
  try {
    var data = getCommentData(e);
    var postId = data.postId;
    var userId = data.userId;
    var comment = data.comment;
    
    Logger.log("Creating comment: " + JSON.stringify(data));
    
    if (!postId || !userId || !comment) {
      return { error: "Post ID, User ID, dan komentar harus diisi" };
    }
    
    var commentsSheet = getSheet("Comments");
    var newId = "COMMENT_" + Date.now();
    
    commentsSheet.appendRow([
      newId,
      postId,
      userId,
      comment,
      new Date()
    ]);
    
    return {
      message: "Komentar berhasil dibuat",
      comment: {
        id: newId,
        idComment: newId,
        idPostingan: postId,
        userId: userId,
        comment: comment,
        timestamp: new Date()
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

    var commentsSheet = getSheet("Comments");
    var data = commentsSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === commentId) {
        // Check if user owns this comment or is admin
        if (data[i][2] === userId) {
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

function handleUpdatePost(e) {
  try {
    var data = getUpdatePostData(e);
    var postId = data.postId;
    var userId = data.userId;
    var judul = data.judul;
    var deskripsi = data.deskripsi;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var postData = postingSheet.getDataRange().getValues();
    
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        // Check if user owns this post
        if (postData[i][1] === userId) {
          if (judul !== undefined) {
            postingSheet.getRange(i + 1, 3).setValue(judul);
          }
          if (deskripsi !== undefined) {
            postingSheet.getRange(i + 1, 4).setValue(deskripsi);
          }
          
          return { 
            message: "Postingan berhasil diupdate",
            post: {
              id: postId,
              judul: judul !== undefined ? judul : postData[i][2],
              deskripsi: deskripsi !== undefined ? deskripsi : postData[i][3]
            }
          };
        } else {
          return { error: "Anda tidak memiliki izin untuk mengedit postingan ini" };
        }
      }
    }

    return { error: "Postingan tidak ditemukan" };

  } catch (error) {
    Logger.log("Update post error: " + error.toString());
    return { error: "Error mengupdate postingan: " + error.toString() };
  }
}

function handleDeletePost(e) {
  try {
    var data = getDeletePostData(e);
    var postId = data.postId;
    var userId = data.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var data = postingSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        // Check if user owns this post or is admin
        if (data[i][1] === userId) {
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

function deletePostInteractions(postId) {
  try {
    var interactionsSheet = getSheet("UserInteractions");
    var data = interactionsSheet.getDataRange().getValues();
    
    // Delete from bottom to top to avoid index issues
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === postId) {
        interactionsSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    Logger.log("Delete post interactions error: " + error.toString());
  }
}

function deletePostComments(postId) {
  try {
    var commentsSheet = getSheet("Comments");
    var data = commentsSheet.getDataRange().getValues();
    
    // Delete from bottom to top to avoid index issues
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === postId) {
        commentsSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    Logger.log("Delete post comments error: " + error.toString());
  }
}

function handleUploadImage(e) {
  try {
    var data = getUploadData(e);
    var imageBase64 = data.imageBase64;
    var fileName = data.fileName || "image_" + Date.now() + ".jpg";

    if (!imageBase64) {
      return { error: "Data gambar harus diisi" };
    }

    // Remove data URL prefix if present
    if (imageBase64.indexOf('data:') === 0) {
      imageBase64 = imageBase64.split(',')[1];
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), 'image/jpeg', fileName);
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var file = folder.createFile(blob);
    
    var fileUrl = "https://drive.google.com/uc?id=" + file.getId() + "&export=view";

    return {
      message: "Gambar berhasil diupload",
      imageUrl: fileUrl,
      fileId: file.getId()
    };

  } catch (error) {
    Logger.log("Upload image error: " + error.toString());
    return { error: "Error upload gambar: " + error.toString() };
  }
}

function handleGetAdminStats() {
  try {
    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");
    var commentsSheet = getSheet("Comments");
    
    var posts = postingSheet.getDataRange().getValues();
    var users = usersSheet.getDataRange().getValues();
    var comments = commentsSheet.getDataRange().getValues();
    
    return {
      totalPosts: Math.max(0, posts.length - 1),
      totalUsers: Math.max(0, users.length - 1),
      totalComments: Math.max(0, comments.length - 1)
    };

  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error mengambil statistik: " + error.toString() };
  }
}

// Helper functions for parsing request data
function getCredentials(e) {
  if (e && e.parameter) {
    return {
      email: e.parameter.email || "",
      password: e.parameter.password || ""
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        email: data.email || "",
        password: data.password || ""
      };
    } catch (error) {
      Logger.log("Parse credentials error: " + error.toString());
    }
  }
  return {};
}

function getUserData(e) {
  if (e && e.parameter) {
    return {
      email: e.parameter.email || "",
      username: e.parameter.username || "",
      password: e.parameter.password || "",
      nim: e.parameter.nim || "",
      jurusan: e.parameter.jurusan || "",
      gender: e.parameter.gender || "male",
      role: e.parameter.role || "user"
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        email: data.email || "",
        username: data.username || "",
        password: data.password || "",
        nim: data.nim || "",
        jurusan: data.jurusan || "",
        gender: data.gender || "male",
        role: data.role || "user"
      };
    } catch (error) {
      Logger.log("Parse user data error: " + error.toString());
    }
  }
  return {};
}

function getPostData(e) {
  if (e && e.parameter) {
    return {
      userId: e.parameter.userId || "",
      judul: e.parameter.judul || "",
      deskripsi: e.parameter.deskripsi || "",
      imageUrl: e.parameter.imageUrl || ""
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        userId: data.userId || "",
        judul: data.judul || "",
        deskripsi: data.deskripsi || "",
        imageUrl: data.imageUrl || ""
      };
    } catch (error) {
      Logger.log("Parse post data error: " + error.toString());
    }
  }
  return {};
}

function getUpdatePostData(e) {
  if (e && e.parameter) {
    return {
      postId: e.parameter.postId || "",
      userId: e.parameter.userId || "",
      judul: e.parameter.judul,
      deskripsi: e.parameter.deskripsi
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        postId: data.postId || "",
        userId: data.userId || "",
        judul: data.judul,
        deskripsi: data.deskripsi
      };
    } catch (error) {
      Logger.log("Parse update post data error: " + error.toString());
    }
  }
  return {};
}

function getLikeData(e) {
  if (e && e.parameter) {
    return {
      postId: e.parameter.postId || "",
      userId: e.parameter.userId || "",
      type: e.parameter.type || "like"
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        postId: data.postId || "",
        userId: data.userId || "",
        type: data.type || "like"
      };
    } catch (error) {
      Logger.log("Parse like data error: " + error.toString());
    }
  }
  return {};
}

function getCommentData(e) {
  if (e && e.parameter) {
    return {
      postId: e.parameter.postId || "",
      userId: e.parameter.userId || "",
      comment: e.parameter.comment || "",
      commentId: e.parameter.commentId || ""
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        postId: data.postId || "",
        userId: data.userId || "",
        comment: data.comment || "",
        commentId: data.commentId || ""
      };
    } catch (error) {
      Logger.log("Parse comment data error: " + error.toString());
    }
  }
  return {};
}

function getUploadData(e) {
  if (e && e.parameter) {
    return {
      imageBase64: e.parameter.imageBase64 || "",
      fileName: e.parameter.fileName || ""
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        imageBase64: data.imageBase64 || "",
        fileName: data.fileName || ""
      };
    } catch (error) {
      Logger.log("Parse upload data error: " + error.toString());
    }
  }
  return {};
}

function getDeletePostData(e) {
  if (e && e.parameter) {
    return {
      postId: e.parameter.postId || "",
      userId: e.parameter.userId || ""
    };
  }
  
  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      return {
        postId: data.postId || "",
        userId: data.userId || ""
      };
    } catch (error) {
      Logger.log("Parse delete post data error: " + error.toString());
    }
  }
  return {};
}