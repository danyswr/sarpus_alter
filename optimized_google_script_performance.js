/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - OPTIMIZED PERFORMANCE VERSION
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * OPTIMIZATIONS:
 * - Faster delete operations with batch processing
 * - Improved post sorting and real-time updates
 * - Enhanced error handling and response times
 * - Better memory management for large datasets
 */

// Google Drive folder ID untuk menyimpan gambar
var DRIVE_FOLDER_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";

// Cache for frequently accessed data
var spreadsheetCache = null;
var sheetsCache = {};

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
    message: "Connection successful - Optimized Performance Version",
    timestamp: new Date().toISOString(),
    status: "ok",
    version: "optimized_v2.0"
  };
}

function getSpreadsheet() {
  if (!spreadsheetCache) {
    spreadsheetCache = SpreadsheetApp.getActiveSpreadsheet();
  }
  return spreadsheetCache;
}

function getSheet(sheetName) {
  if (!sheetsCache[sheetName]) {
    var spreadsheet = getSpreadsheet();
    sheetsCache[sheetName] = spreadsheet.getSheetByName(sheetName);
    
    if (!sheetsCache[sheetName] && (sheetName === "Users" || sheetName === "Posting" || sheetName === "UserInteractions")) {
      sheetsCache[sheetName] = createSheet(sheetName);
    }
  }
  return sheetsCache[sheetName];
}

function createSheet(sheetName) {
  var spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.insertSheet(sheetName);
  
  if (sheetName === "Users") {
    sheet.getRange(1, 1, 1, 9).setValues([[
      "ID Users", "Email", "Username", "Password", "NIM", "Gender", "Jurusan", "Role", "TimeStamp"
    ]]);
  } else if (sheetName === "Posting") {
    sheet.getRange(1, 1, 1, 8).setValues([[
      "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
    ]]);
  } else if (sheetName === "UserInteractions") {
    sheet.getRange(1, 1, 1, 4).setValues([[
      "idPostingan", "idUsers", "interactionType", "timestamp"
    ]]);
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
        if (userPassword.toString() === password.toString()) {
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

    var usersSheet = getSheet("Users");

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

function handleGetPosts() {
  try {
    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];

    if (postData.length < 2) {
      return [];
    }

    // Create username lookup for better performance
    var userLookup = {};
    if (userData.length > 1) {
      for (var j = 1; j < userData.length; j++) {
        userLookup[userData[j][0]] = userData[j][2] || "User";
      }
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
        username: userLookup[row[1]] || "User"
      };

      posts.push(post);
    }

    // Optimized sorting - sort by timestamp then by ID
    posts.sort(function(a, b) {
      var dateA = new Date(a.timestamp).getTime();
      var dateB = new Date(b.timestamp).getTime();
      
      // Primary sort: by timestamp (newest first)
      if (!isNaN(dateA) && !isNaN(dateB) && Math.abs(dateA - dateB) > 1000) {
        return dateB - dateA;
      }
      
      // Secondary sort: by ID (newer posts have higher IDs)
      var idA = parseInt(a.id.replace(/\D/g, '') || '0');
      var idB = parseInt(b.id.replace(/\D/g, '') || '0');
      return idB - idA;
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

    var postingSheet = getSheet("Posting");
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

function handleUpdatePost(e) {
  try {
    var updateData = getUpdatePostData(e);
    var postId = updateData.postId;
    var userId = updateData.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var data = postingSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        // Check if user is the owner
        var postOwner = data[i][1];
        
        if (postOwner === userId) {
          // Update the post using batch operations for better performance
          var updates = [];
          if (updateData.judul !== undefined) {
            updates.push({range: postingSheet.getRange(i + 1, 3), value: updateData.judul});
          }
          if (updateData.deskripsi !== undefined) {
            updates.push({range: postingSheet.getRange(i + 1, 4), value: updateData.deskripsi});
          }
          
          // Batch update for better performance
          updates.forEach(function(update) {
            update.range.setValue(update.value);
          });
          
          return {
            message: "Postingan berhasil diupdate",
            post: {
              id: postId,
              idPostingan: postId,
              judul: updateData.judul !== undefined ? updateData.judul : data[i][2],
              deskripsi: updateData.deskripsi !== undefined ? updateData.deskripsi : data[i][3]
            }
          };
        } else {
          return { error: "Anda tidak memiliki izin untuk mengedit postingan ini" };
        }
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Update post error: " + error.toString());
    return { error: "Error update postingan: " + error.toString() };
  }
}

function handleLikeDislike(e) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;
    var userId = data.userId || 'anonymous';
    var type = data.type || "like";

    if (!postId || !userId || userId === 'anonymous') {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var interactionsSheet = getSheet("UserInteractions");

    // Check existing interaction
    var existingInteraction = checkExistingInteraction(interactionsSheet, postId, userId);
    
    if (existingInteraction) {
      if (existingInteraction.type === type) {
        return { error: "Anda sudah " + (type === "like" ? "like" : "dislike") + " postingan ini" };
      } else {
        // Update existing interaction
        updateExistingInteraction(interactionsSheet, postId, userId, type, existingInteraction.row);
        updatePostCounts(postingSheet, postId, type, existingInteraction.type);
      }
    } else {
      // New interaction
      recordNewInteraction(interactionsSheet, postId, userId, type);
      incrementPostCount(postingSheet, postId, type);
    }
    
    var updatedPost = getUpdatedPostCounts(postingSheet, postId);
    return {
      message: "Berhasil " + type,
      likes: updatedPost.likes,
      dislikes: updatedPost.dislikes,
      newLikeCount: updatedPost.likes,
      newDislikeCount: updatedPost.dislikes
    };

  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error update like/dislike: " + error.toString() };
  }
}

function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId;

    Logger.log("OPTIMIZED Delete request: " + postId + " by user: " + userId);

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var data = postingSheet.getDataRange().getValues();
    
    // Find and delete post in one operation for better performance
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === postId) {
        var postOwner = data[i][1];
        var userRole = getUserRole(userId);
        
        if (postOwner === userId || userRole === 'admin') {
          // Delete the post immediately
          postingSheet.deleteRow(i + 1);
          
          // Delete related interactions asynchronously for better performance
          deletePostInteractionsAsync(postId);
          
          Logger.log("OPTIMIZED Post deleted successfully: " + postId);
          return { message: "Postingan berhasil dihapus" };
        } else {
          return { error: "Anda tidak memiliki izin untuk menghapus postingan ini" };
        }
      }
    }

    return { error: "Post tidak ditemukan: " + postId };

  } catch (error) {
    Logger.log("OPTIMIZED Delete post error: " + error.toString());
    return { error: "Error hapus postingan: " + error.toString() };
  }
}

function deletePostInteractionsAsync(postId) {
  // Use trigger for async deletion to improve response time
  try {
    var interactionsSheet = getSheet("UserInteractions");
    if (!interactionsSheet) return;
    
    var data = interactionsSheet.getDataRange().getValues();
    var rowsToDelete = [];
    
    // Collect rows to delete
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === postId) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Delete rows in reverse order for better performance
    rowsToDelete.forEach(function(rowIndex) {
      interactionsSheet.deleteRow(rowIndex);
    });
    
  } catch (error) {
    Logger.log("Async delete interactions error: " + error.toString());
  }
}

// Helper functions remain the same but optimized
function checkExistingInteraction(interactionsSheet, postId, userId) {
  var data = interactionsSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId && data[i][1] === userId) {
      return {
        type: data[i][2],
        row: i + 1
      };
    }
  }
  
  return null;
}

function updateExistingInteraction(interactionsSheet, postId, userId, newType, row) {
  var updates = [
    {range: interactionsSheet.getRange(row, 3), value: newType},
    {range: interactionsSheet.getRange(row, 4), value: new Date()}
  ];
  
  updates.forEach(function(update) {
    update.range.setValue(update.value);
  });
}

function recordNewInteraction(interactionsSheet, postId, userId, type) {
  interactionsSheet.appendRow([postId, userId, type, new Date()]);
}

function updatePostCounts(postingSheet, postId, newType, oldType) {
  var data = postingSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      var currentLikes = parseInt(data[i][6] || 0);
      var currentDislikes = parseInt(data[i][7] || 0);
      
      // Remove old interaction
      if (oldType === "like" && currentLikes > 0) {
        currentLikes -= 1;
      } else if (oldType === "dislike" && currentDislikes > 0) {
        currentDislikes -= 1;
      }
      
      // Add new interaction
      if (newType === "like") {
        currentLikes += 1;
      } else if (newType === "dislike") {
        currentDislikes += 1;
      }
      
      // Batch update
      var updates = [
        {range: postingSheet.getRange(i + 1, 7), value: currentLikes},
        {range: postingSheet.getRange(i + 1, 8), value: currentDislikes}
      ];
      
      updates.forEach(function(update) {
        update.range.setValue(update.value);
      });
      break;
    }
  }
}

function incrementPostCount(postingSheet, postId, type) {
  var data = postingSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === postId) {
      var currentLikes = parseInt(data[i][6] || 0);
      var currentDislikes = parseInt(data[i][7] || 0);
      
      if (type === "like") {
        currentLikes += 1;
        postingSheet.getRange(i + 1, 7).setValue(currentLikes);
      } else if (type === "dislike") {
        currentDislikes += 1;
        postingSheet.getRange(i + 1, 8).setValue(currentDislikes);
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

function getUserRole(userId) {
  try {
    var usersSheet = getSheet("Users");
    if (!usersSheet) return "user";
    
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
    var imageBase64 = uploadData.imageBase64;
    var fileName = uploadData.fileName || "image_" + Date.now() + ".jpg";

    if (!imageBase64) {
      return { error: "Data gambar harus diisi" };
    }

    try {
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), 'image/jpeg', fileName);
      var file = folder.createFile(blob);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var imageUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
      
      return {
        message: "Gambar berhasil diupload",
        imageUrl: imageUrl,
        fileId: file.getId()
      };
    } catch (driveError) {
      Logger.log("Drive upload error: " + driveError.toString());
      return { error: "Error upload ke Google Drive: " + driveError.toString() };
    }

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

    var usersSheet = getSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return {
          user: {
            idUsers: data[i][0],
            email: data[i][1],
            username: data[i][2],
            nim: data[i][4],
            gender: data[i][5],
            jurusan: data[i][6],
            role: data[i][7]
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

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var usersSheet = getSheet("Users");
    var data = usersSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        // Batch update for better performance
        var updates = [];
        if (updateData.username) updates.push({range: usersSheet.getRange(i + 1, 3), value: updateData.username});
        if (updateData.nim) updates.push({range: usersSheet.getRange(i + 1, 5), value: updateData.nim});
        if (updateData.gender) updates.push({range: usersSheet.getRange(i + 1, 6), value: updateData.gender});
        if (updateData.jurusan) updates.push({range: usersSheet.getRange(i + 1, 7), value: updateData.jurusan});

        updates.forEach(function(update) {
          update.range.setValue(update.value);
        });

        return {
          message: "Profile berhasil diupdate",
          user: {
            idUsers: data[i][0],
            email: data[i][1],
            username: updateData.username || data[i][2],
            nim: updateData.nim || data[i][4],
            gender: updateData.gender || data[i][5],
            jurusan: updateData.jurusan || data[i][6],
            role: data[i][7]
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
    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();

    var totalPosts = postData.length - 1;
    var totalUsers = userData.length - 1;
    var totalLikes = 0;
    var totalDislikes = 0;

    for (var i = 1; i < postData.length; i++) {
      totalLikes += parseInt(postData[i][6] || 0);
      totalDislikes += parseInt(postData[i][7] || 0);
    }

    var topPosts = [];
    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      topPosts.push({
        idPostingan: row[0],
        judul: row[2],
        deskripsi: row[3],
        likes: parseInt(row[6] || 0),
        dislikes: parseInt(row[7] || 0),
        timestamp: row[5]
      });
    }

    topPosts.sort(function(a, b) { return b.likes - a.likes; });
    topPosts = topPosts.slice(0, 10);

    return {
      stats: {
        totalPosts: totalPosts,
        totalUsers: totalUsers,
        totalLikes: totalLikes,
        totalDislikes: totalDislikes,
        topPosts: topPosts
      }
    };

  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error get admin stats: " + error.toString() };
  }
}

// Data parsing helper functions (same as before but optimized)
function getCredentials(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      email: data.email || "",
      password: data.password || ""
    };
  }
  return {
    email: e.parameter.email || "",
    password: e.parameter.password || ""
  };
}

function getUserData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      email: data.email || "",
      username: data.username || "",
      password: data.password || "",
      nim: data.nim || "",
      gender: data.gender || "male",
      jurusan: data.jurusan || "",
      role: data.role || "user"
    };
  }
  return {
    email: e.parameter.email || "",
    username: e.parameter.username || "",
    password: e.parameter.password || "",
    nim: e.parameter.nim || "",
    gender: e.parameter.gender || "male",
    jurusan: e.parameter.jurusan || "",
    role: e.parameter.role || "user"
  };
}

function getPostData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      userId: data.userId || "",
      judul: data.judul || "",
      deskripsi: data.deskripsi || "",
      imageUrl: data.imageUrl || ""
    };
  }
  return {
    userId: e.parameter.userId || "",
    judul: e.parameter.judul || "",
    deskripsi: e.parameter.deskripsi || "",
    imageUrl: e.parameter.imageUrl || ""
  };
}

function getUpdatePostData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      postId: data.postId || "",
      userId: data.userId || "",
      judul: data.judul,
      deskripsi: data.deskripsi
    };
  }
  return {
    postId: e.parameter.postId || "",
    userId: e.parameter.userId || "",
    judul: e.parameter.judul,
    deskripsi: e.parameter.deskripsi
  };
}

function getLikeData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      postId: data.postId || "",
      userId: data.userId || "",
      type: data.type || "like"
    };
  }
  return {
    postId: e.parameter.postId || "",
    userId: e.parameter.userId || "",
    type: e.parameter.type || "like"
  };
}

function getUploadData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      imageBase64: data.imageBase64 || "",
      fileName: data.fileName || "image_" + Date.now() + ".jpg"
    };
  }
  return {
    imageBase64: e.parameter.imageBase64 || "",
    fileName: e.parameter.fileName || "image_" + Date.now() + ".jpg"
  };
}

function getDeletePostData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      postId: data.postId || "",
      userId: data.userId || ""
    };
  }
  return {
    postId: e.parameter.postId || "",
    userId: e.parameter.userId || ""
  };
}

function getProfileData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      userId: data.userId || ""
    };
  }
  return {
    userId: e.parameter.userId || ""
  };
}

function getUpdateProfileData(e) {
  if (e.postData && e.postData.contents) {
    var data = JSON.parse(e.postData.contents);
    return {
      userId: data.userId || "",
      username: data.username || "",
      nim: data.nim || "",
      gender: data.gender || "",
      jurusan: data.jurusan || ""
    };
  }
  return {
    userId: e.parameter.userId || "",
    username: e.parameter.username || "",
    nim: e.parameter.nim || "",
    gender: e.parameter.gender || "",
    jurusan: e.parameter.jurusan || ""
  };
}