/**
 * FIXED Google Apps Script untuk Mahasiswa Feedback Platform - WITH USERNAME FIX
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 * Sheet "UserInteractions": idPostingan, idUsers, interactionType, timestamp
 * Sheet "Comments": idComment, idPostingan, idUsers, comment, timestamp
 */

var SPREADSHEET_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function doOptions(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}

function handleRequest(e) {
  try {
    var action = getAction(e);
    var result;
    
    switch (action) {
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
      case "getComments":
        result = handleGetComments(e);
        break;
      case "createComment":
        result = handleCreateComment(e);
        break;
      case "deleteComment":
        result = handleDeleteComment(e);
        break;
      case "deletePost":
        result = handleDeletePost(e);
        break;
      case "uploadImage":
        result = handleUploadImage(e);
        break;
      case "getAdminStats":
        result = handleGetAdminStats();
        break;
      default:
        result = { error: "Action tidak dikenali: " + action };
    }
    
    var response = ContentService.createTextOutput(JSON.stringify(result));
    response.setMimeType(ContentService.MimeType.JSON);
    return response;
    
  } catch (error) {
    Logger.log("Error in handleRequest: " + error.toString());
    var errorResponse = ContentService.createTextOutput(JSON.stringify({ 
      error: "Internal server error: " + error.toString() 
    }));
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    return errorResponse;
  }
}

function getAction(e) {
  if (e && e.parameter && e.parameter.action) {
    return e.parameter.action;
  }

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
    status: "ok"
  };
}

function getSheet(sheetName) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
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

    // Create a map of user IDs to usernames for efficient lookup
    var userMap = {};
    if (userData.length > 1) {
      for (var j = 1; j < userData.length; j++) {
        var userId = userData[j][0]; // ID Users column
        var username = userData[j][2]; // Username column
        if (userId && username) {
          userMap[userId] = username;
        }
      }
    }

    var posts = [];
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      var userId = row[1] || "";
      
      var post = {
        id: row[0] || "POST_" + i,
        idPostingan: row[0] || "POST_" + i,  
        userId: userId,
        idUsers: userId,
        judul: row[2] || "",
        deskripsi: row[3] || "",
        imageUrl: row[4] || "",
        timestamp: row[5] || new Date(),
        likes: parseInt(row[6] || 0),
        dislikes: parseInt(row[7] || 0),
        like: parseInt(row[6] || 0),
        dislike: parseInt(row[7] || 0),
        username: userMap[userId] || "Unknown User"
      };

      posts.push(post);
    }

    // Sort posts by timestamp (newest first)
    posts.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return posts;

  } catch (error) {
    Logger.log("Get posts error: " + error.toString());
    return { error: "Error mengambil postingan: " + error.toString() };
  }
}

function handleLogin(e) {
  try {
    var data = getCredentials(e);
    var email = data.email;
    var password = data.password;

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var usersSheet = getSheet("Users");
    var userData = usersSheet.getDataRange().getValues();

    for (var i = 1; i < userData.length; i++) {
      var row = userData[i];
      if (row[1] === email) { // Email column
        if (row[3] === password) { // Password column
          return {
            message: "Login berhasil",
            user: {
              idUsers: row[0],
              email: row[1],
              username: row[2],
              role: row[7] || "user"
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
    return { error: "Error saat login: " + error.toString() };
  }
}

function handleRegister(e) {
  try {
    var data = getUserData(e);
    var email = data.email;
    var username = data.username;
    var password = data.password;
    var nim = data.nim || "";
    var gender = data.gender || "male";
    var jurusan = data.jurusan || "";

    if (!email || !username || !password) {
      return { error: "Email, username, dan password harus diisi" };
    }

    var usersSheet = getSheet("Users");
    var userData = usersSheet.getDataRange().getValues();

    // Check if email or username already exists
    for (var i = 1; i < userData.length; i++) {
      var row = userData[i];
      if (row[1] === email) {
        return { error: "Email sudah terdaftar" };
      }
      if (row[2] === username) {
        return { error: "Username sudah digunakan" };
      }
    }

    var userId = "USER_" + Date.now();
    var timestamp = new Date();

    usersSheet.appendRow([
      userId,
      email,
      username,
      password,
      nim,
      gender,
      jurusan,
      "user",
      timestamp
    ]);

    return {
      message: "Registrasi berhasil",
      user: {
        idUsers: userId,
        email: email,
        username: username,
        role: "user"
      }
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error saat registrasi: " + error.toString() };
  }
}

function handleCreatePost(e) {
  try {
    var data = getPostData(e);
    var userId = data.idUsers;
    var judul = data.judul;
    var deskripsi = data.deskripsi;
    var imageUrl = data.imageUrl || "";

    if (!userId || !judul || !deskripsi) {
      return { error: "User ID, judul, dan deskripsi harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var postId = "POST_" + Date.now();
    var timestamp = new Date();

    postingSheet.appendRow([
      postId,
      userId,
      judul,
      deskripsi,
      imageUrl,
      timestamp,
      0, // likeCount
      0  // dislikeCount
    ]);

    return {
      message: "Post berhasil dibuat",
      post: {
        idPostingan: postId,
        idUsers: userId,
        judul: judul,
        deskripsi: deskripsi,
        imageUrl: imageUrl,
        timestamp: timestamp,
        like: 0,
        dislike: 0
      }
    };

  } catch (error) {
    Logger.log("Create post error: " + error.toString());
    return { error: "Error membuat post: " + error.toString() };
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

    var postingSheet = getSheet("Posting");
    var interactionsSheet = getSheet("UserInteractions");
    
    var postData = postingSheet.getDataRange().getValues();
    var postRow = -1;
    
    // Find the post
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        postRow = i + 1;
        break;
      }
    }
    
    if (postRow === -1) {
      return { error: "Post tidak ditemukan" };
    }

    // Check existing interaction
    var interactionsData = interactionsSheet.getDataRange().getValues();
    var existingRow = -1;
    var existingType = null;
    
    for (var j = 1; j < interactionsData.length; j++) {
      if (interactionsData[j][0] === postId && interactionsData[j][1] === userId) {
        existingRow = j + 1;
        existingType = interactionsData[j][2];
        break;
      }
    }

    var currentLikes = parseInt(postData[postRow - 1][6] || 0);
    var currentDislikes = parseInt(postData[postRow - 1][7] || 0);

    if (existingRow !== -1) {
      // User has already interacted
      if (existingType === type) {
        // Remove interaction (toggle off)
        interactionsSheet.deleteRow(existingRow);
        if (type === "like") {
          currentLikes = Math.max(0, currentLikes - 1);
        } else {
          currentDislikes = Math.max(0, currentDislikes - 1);
        }
      } else {
        // Change interaction type
        interactionsSheet.getRange(existingRow, 3).setValue(type);
        interactionsSheet.getRange(existingRow, 4).setValue(new Date());
        
        if (type === "like") {
          currentLikes++;
          currentDislikes = Math.max(0, currentDislikes - 1);
        } else {
          currentDislikes++;
          currentLikes = Math.max(0, currentLikes - 1);
        }
      }
    } else {
      // New interaction
      interactionsSheet.appendRow([postId, userId, type, new Date()]);
      if (type === "like") {
        currentLikes++;
      } else {
        currentDislikes++;
      }
    }

    // Update post counts
    postingSheet.getRange(postRow, 7).setValue(currentLikes);
    postingSheet.getRange(postRow, 8).setValue(currentDislikes);

    return {
      message: "Interaksi berhasil",
      likes: currentLikes,
      dislikes: currentDislikes
    };

  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error saat melakukan interaksi: " + error.toString() };
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
    var postData = postingSheet.getDataRange().getValues();
    
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        // Check if user owns the post or is admin
        if (postData[i][1] === userId || getUserRole(userId) === "admin") {
          postingSheet.deleteRow(i + 1);
          
          // Delete related interactions and comments
          deletePostInteractions(postId);
          deletePostComments(postId);
          
          return { message: "Post berhasil dihapus" };
        } else {
          return { error: "Tidak memiliki izin untuk menghapus post ini" };
        }
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Delete post error: " + error.toString());
    return { error: "Error menghapus post: " + error.toString() };
  }
}

function deletePostInteractions(postId) {
  var interactionsSheet = getSheet("UserInteractions");
  var data = interactionsSheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === postId) {
      interactionsSheet.deleteRow(i + 1);
    }
  }
}

function deletePostComments(postId) {
  var commentsSheet = getSheet("Comments");
  var data = commentsSheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === postId) {
      commentsSheet.deleteRow(i + 1);
    }
  }
}

function getUserRole(userId) {
  var usersSheet = getSheet("Users");
  var userData = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < userData.length; i++) {
    if (userData[i][0] === userId) {
      return userData[i][7] || "user";
    }
  }
  
  return "user";
}

function handleUploadImage(e) {
  try {
    return { error: "Image upload not implemented yet" };
  } catch (error) {
    return { error: "Error uploading image: " + error.toString() };
  }
}

function handleGetAdminStats() {
  try {
    var usersSheet = getSheet("Users");
    var postingSheet = getSheet("Posting");
    
    var userCount = Math.max(0, usersSheet.getDataRange().getNumRows() - 1);
    var postCount = Math.max(0, postingSheet.getDataRange().getNumRows() - 1);
    
    return {
      users: userCount,
      posts: postCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { error: "Error getting admin stats: " + error.toString() };
  }
}

// Helper functions to extract data from requests
function getCredentials(e) {
  if (e && e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      email: postData.email || "",
      password: postData.password || ""
    };
  }
  return { email: "", password: "" };
}

function getUserData(e) {
  if (e && e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      email: postData.email || "",
      username: postData.username || "",
      password: postData.password || "",
      nim: postData.nim || "",
      gender: postData.gender || "male",
      jurusan: postData.jurusan || ""
    };
  }
  return {};
}

function getPostData(e) {
  if (e && e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      idUsers: postData.idUsers || "",
      judul: postData.judul || "",
      deskripsi: postData.deskripsi || "",
      imageUrl: postData.imageUrl || ""
    };
  }
  return {};
}

function getLikeData(e) {
  if (e && e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      postId: postData.postId || "",
      userId: postData.userId || "",
      type: postData.type || "like"
    };
  }
  return {};
}

function getDeletePostData(e) {
  if (e && e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      postId: postData.postId || "",
      userId: postData.userId || ""
    };
  }
  return {};
}