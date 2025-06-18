/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - FIXED VERSION
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET YANG BENAR:
 * Sheet "Users": ID Users, Email, Username, Password, NIM, Gender, Jurusan, Role, TimeStamp
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
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
      newId, postData.userId, postData.judul || "", postData.deskripsi,
      postData.imageUrl || "", new Date(), 0, 0
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

function handleLikeDislike(e, forceType) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;
    var type = forceType || data.type || "like";

    Logger.log("Processing " + type + " for post: " + postId);

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    
    // Find the post and update like/dislike count
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) { // idPostingan is in column 0
        var currentLikes = parseInt(postData[i][6] || 0);    // likeCount is in column 6
        var currentDislikes = parseInt(postData[i][7] || 0); // dislikeCount is in column 7

        if (type === "like") {
          currentLikes += 1;
        } else if (type === "dislike") {
          currentDislikes += 1;
        }

        // Update the spreadsheet
        postingSheet.getRange(i + 1, 7).setValue(currentLikes);   // Column 7 = likeCount
        postingSheet.getRange(i + 1, 8).setValue(currentDislikes); // Column 8 = dislikeCount

        Logger.log("Updated " + type + " for post " + postId + ": likes=" + currentLikes + ", dislikes=" + currentDislikes);

        return {
          message: "Berhasil update " + type,
          likes: currentLikes,
          dislikes: currentDislikes,
          newLikeCount: currentLikes,
          newDislikeCount: currentDislikes,
          post: {
            id: postId,
            idPostingan: postId,
            likes: currentLikes,
            dislikes: currentDislikes
          }
        };
      }
    }

    return { error: "Post tidak ditemukan: " + postId };

  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error update like/dislike: " + error.toString() };
  }
}

function handleUploadImage(e) {
  try {
    var uploadData = getUploadData(e);
    var imageBase64 = uploadData.imageBase64;
    var fileName = uploadData.fileName || "image_" + Date.now() + ".jpg";

    if (!imageBase64) {
      return { error: "Image data harus diisi" };
    }

    // Convert base64 to blob
    var blob = Utilities.newBlob(
      Utilities.base64Decode(imageBase64),
      'image/jpeg',
      fileName
    );

    // Get the Drive folder
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Create the file in Drive
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var directUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    Logger.log("Image uploaded successfully: " + directUrl);

    return {
      message: "Image berhasil diupload",
      imageUrl: directUrl,
      fileId: fileId
    };

  } catch (error) {
    Logger.log("Upload image error: " + error.toString());
    return { error: "Error upload image: " + error.toString() };
  }
}

function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    
    for (var i = 1; i < postData.length; i++) {
      if (postData[i][0] === postId) {
        // Check if user owns the post or is admin
        if (postData[i][1] === userId || getUserRole(userId) === "admin") {
          postingSheet.deleteRow(i + 1);
          return { message: "Postingan berhasil dihapus" };
        } else {
          return { error: "Tidak ada izin untuk menghapus postingan ini" };
        }
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
      if (userData[i][0] === userId) {
        return userData[i][7] || "user"; // Role is in column 7
      }
    }
    
    return "user";
  } catch (error) {
    return "user";
  }
}

function handleGetProfile(e) {
  try {
    var profileData = getProfileData(e);
    var userId = profileData.userId;

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var userData = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) {
        return {
          user: {
            idUsers: userData[i][0],
            email: userData[i][1],
            username: userData[i][2],
            nim: userData[i][4],
            gender: userData[i][5],
            jurusan: userData[i][6],
            role: userData[i][7]
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
    var updateData = getUpdateProfileData(e);
    var userId = updateData.userId;

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var userData = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) {
        // Update fields
        if (updateData.username) usersSheet.getRange(i + 1, 3).setValue(updateData.username);
        if (updateData.nim) usersSheet.getRange(i + 1, 5).setValue(updateData.nim);
        if (updateData.gender) usersSheet.getRange(i + 1, 6).setValue(updateData.gender);
        if (updateData.jurusan) usersSheet.getRange(i + 1, 7).setValue(updateData.jurusan);

        return {
          message: "Profile berhasil diupdate",
          user: {
            idUsers: userData[i][0],
            email: userData[i][1],
            username: updateData.username || userData[i][2],
            nim: updateData.nim || userData[i][4],
            gender: updateData.gender || userData[i][5],
            jurusan: updateData.jurusan || userData[i][6],
            role: userData[i][7]
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

    if (!postingSheet || !usersSheet) {
      return { error: "Required sheets tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();

    var totalPosts = postData.length - 1; // -1 for header
    var totalUsers = userData.length - 1;
    var totalLikes = 0;
    var totalDislikes = 0;

    // Calculate total likes and dislikes
    for (var i = 1; i < postData.length; i++) {
      totalLikes += parseInt(postData[i][6] || 0);
      totalDislikes += parseInt(postData[i][7] || 0);
    }

    // Find most liked posts
    var mostLikedPosts = [];
    for (var i = 1; i < postData.length; i++) {
      var likes = parseInt(postData[i][6] || 0);
      if (likes > 0) {
        mostLikedPosts.push({
          idPostingan: postData[i][0],
          judul: postData[i][2],
          deskripsi: postData[i][3],
          likes: likes,
          dislikes: parseInt(postData[i][7] || 0)
        });
      }
    }

    // Sort by likes descending
    mostLikedPosts.sort(function(a, b) { return b.likes - a.likes; });

    return {
      stats: {
        totalPosts: totalPosts,
        totalUsers: totalUsers,
        totalLikes: totalLikes,
        totalDislikes: totalDislikes,
        mostLikedPosts: mostLikedPosts.slice(0, 10) // Top 10
      }
    };

  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error mengambil admin stats: " + error.toString() };
  }
}

// Helper functions to extract data from requests
function getCredentials(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      email: postData.email || e.parameter.email,
      password: postData.password || e.parameter.password
    };
  }
  return {
    email: e.parameter.email,
    password: e.parameter.password
  };
}

function getUserData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      email: postData.email,
      username: postData.username,
      password: postData.password,
      nim: postData.nim,
      gender: postData.gender,
      jurusan: postData.jurusan,
      role: postData.role
    };
  }
  return {
    email: e.parameter.email,
    username: e.parameter.username,
    password: e.parameter.password,
    nim: e.parameter.nim,
    gender: e.parameter.gender,
    jurusan: e.parameter.jurusan,
    role: e.parameter.role
  };
}

function getPostData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      userId: postData.userId,
      judul: postData.judul,
      deskripsi: postData.deskripsi,
      imageUrl: postData.imageUrl
    };
  }
  return {
    userId: e.parameter.userId,
    judul: e.parameter.judul,
    deskripsi: e.parameter.deskripsi,
    imageUrl: e.parameter.imageUrl
  };
}

function getUploadData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      imageBase64: postData.imageBase64,
      fileName: postData.fileName
    };
  }
  return {
    imageBase64: e.parameter.imageBase64,
    fileName: e.parameter.fileName
  };
}

function getLikeData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      postId: postData.postId,
      type: postData.type,
      userId: postData.userId
    };
  }
  return {
    postId: e.parameter.postId,
    type: e.parameter.type,
    userId: e.parameter.userId
  };
}

function getDeletePostData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      postId: postData.postId,
      userId: postData.userId
    };
  }
  return {
    postId: e.parameter.postId,
    userId: e.parameter.userId
  };
}

function getProfileData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      userId: postData.userId
    };
  }
  return {
    userId: e.parameter.userId
  };
}

function getUpdateProfileData(e) {
  if (e.postData && e.postData.contents) {
    var postData = JSON.parse(e.postData.contents);
    return {
      userId: postData.userId,
      username: postData.username,
      nim: postData.nim,
      gender: postData.gender,
      jurusan: postData.jurusan
    };
  }
  return {
    userId: e.parameter.userId,
    username: e.parameter.username,
    nim: e.parameter.nim,
    gender: e.parameter.gender,
    jurusan: e.parameter.jurusan
  };
}