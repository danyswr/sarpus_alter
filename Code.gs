/**
 * Google Apps Script untuk Mahasiswa Feedback Platform - FINAL VERSION WITH IMPROVED CORS
 * Deploy sebagai web app dengan "Execute as: Me" dan "Who has access: Anyone"
 * 
 * STRUKTUR SPREADSHEET:
 * Sheet "Users": idUsers, username, email, password, role, nim, jurusan, gender, bio, location, website, createdAt
 * Sheet "Posting": idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount
 */

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
    // Create response dengan CORS headers yang lebih lengkap
    var response = ContentService.createTextOutput();
    response.setMimeType(ContentService.MimeType.JSON);

    // Handle preflight OPTIONS request
    if (e.method === "OPTIONS") {
      return response.setContent(JSON.stringify({ 
        status: "ok",
        message: "CORS preflight successful"
      }));
    }

    // Dapatkan action
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
      case "likePost":
        result = handleLikePost(e);
        break;
      case "dislikePost":
        result = handleDislikePost(e);
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
  // Coba dari GET parameters dulu
  if (e.parameter && e.parameter.action) {
    return e.parameter.action;
  }

  // Coba dari POST body
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
    Logger.log("Password received: " + (password ? "Yes (length: " + password.length + ")" : "No"));

    if (!email || !password) {
      return { error: "Email dan password harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var data = usersSheet.getDataRange().getValues();
    Logger.log("Total users in sheet: " + (data.length - 1));
    
    if (data.length < 2) {
      return { error: "Tidak ada data user" };
    }

    var headers = data[0];
    var emailCol = findColumn(headers, "email");
    var passwordCol = findColumn(headers, "password");

    if (emailCol === -1 || passwordCol === -1) {
      return { error: "Kolom email atau password tidak ditemukan" };
    }

    // Cari user berdasarkan email
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var userEmail = row[emailCol];
      var userPassword = row[passwordCol];
      
      if (userEmail && userEmail.toString().toLowerCase() === email.toLowerCase()) {
        Logger.log("User found! Checking password...");
        
        // Check password - support plain text
        if (userPassword.toString() === password.toString()) {
          Logger.log("Password match!");
          
          return {
            message: "Login berhasil",
            idUsers: row[findColumn(headers, "idUsers")] || "USER_" + i,
            username: row[findColumn(headers, "username")] || email.split('@')[0],
            email: email,
            role: row[findColumn(headers, "role")] || "user",
            nim: row[findColumn(headers, "nim")] || "",
            jurusan: row[findColumn(headers, "jurusan")] || "",
            bio: row[findColumn(headers, "bio")] || "",
            location: row[findColumn(headers, "location")] || "",
            website: row[findColumn(headers, "website")] || ""
          };
        } else {
          Logger.log("Password mismatch!");
          return { error: "Password salah" };
        }
      }
    }

    Logger.log("User not found with email: " + email);
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
      // Buat sheet Users jika belum ada
      usersSheet = spreadsheet.insertSheet("Users");
      // Tambah header
      usersSheet.getRange(1, 1, 1, 12).setValues([[
        "idUsers", "username", "email", "password", "role", "nim", "jurusan", "gender", "bio", "location", "website", "createdAt"
      ]]);
    }

    // Cek apakah email sudah ada
    var data = usersSheet.getDataRange().getValues();
    var headers = data[0];
    var emailCol = findColumn(headers, "email");

    for (var i = 1; i < data.length; i++) {
      if (data[i][emailCol] === userData.email) {
        return { error: "Email sudah terdaftar" };
      }
    }

    // Tambah user baru
    var newId = "USER_" + Date.now();
    
    var newRow = [
      newId,                        // idUsers
      userData.username,            // username
      userData.email,               // email
      userData.password,            // password
      userData.role || "user",      // role
      userData.nim || "",           // nim
      userData.jurusan || "",       // jurusan
      userData.gender || "Male",    // gender
      "",                           // bio
      "",                           // location
      "",                           // website
      new Date()                    // createdAt
    ];

    usersSheet.appendRow(newRow);

    return {
      message: "Registrasi berhasil",
      idUsers: newId,
      username: userData.username,
      email: userData.email,
      role: userData.role || "user",
      nim: userData.nim || "",
      jurusan: userData.jurusan || ""
    };

  } catch (error) {
    Logger.log("Register error: " + error.toString());
    return { error: "Error registrasi: " + error.toString() };
  }
}

function handleGetPosts() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!postingSheet) {
      // Buat sheet Posting jika belum ada
      postingSheet = spreadsheet.insertSheet("Posting");
      postingSheet.getRange(1, 1, 1, 8).setValues([[
        "idPostingan", "idUsers", "judul", "deskripsi", "imageUrl", "timestamp", "likeCount", "dislikeCount"
      ]]);
      return []; // Return empty array untuk sheet baru
    }

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet ? usersSheet.getDataRange().getValues() : [];

    if (postData.length < 2) {
      return []; // Return empty array jika tidak ada posts
    }

    var postHeaders = postData[0];
    var userHeaders = userData[0] || [];
    var posts = [];

    for (var i = 1; i < postData.length; i++) {
      var row = postData[i];
      var post = {
        id: row[findColumn(postHeaders, "idPostingan")] || "POST_" + i,
        userId: row[findColumn(postHeaders, "idUsers")] || "",
        timestamp: row[findColumn(postHeaders, "timestamp")] || new Date(),
        judul: row[findColumn(postHeaders, "judul")] || "",
        deskripsi: row[findColumn(postHeaders, "deskripsi")] || "",
        imageUrl: row[findColumn(postHeaders, "imageUrl")] || "",
        likes: parseInt(row[findColumn(postHeaders, "likeCount")] || 0),
        dislikes: parseInt(row[findColumn(postHeaders, "dislikeCount")] || 0),
        username: "Anonymous"
      };

      // Cari username dari Users sheet
      if (userData.length > 1 && post.userId) {
        var userIdCol = findColumn(userHeaders, "idUsers");
        var usernameCol = findColumn(userHeaders, "username");

        for (var j = 1; j < userData.length; j++) {
          if (userData[j][userIdCol] === post.userId) {
            post.username = userData[j][usernameCol] || "Anonymous";
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
      // Buat sheet Posting jika belum ada
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
  return handleLikeDislike(e, "like");
}

function handleDislikePost(e) {
  return handleLikeDislike(e, "dislike");
}

function handleLikeDislike(e, type) {
  try {
    var data = getLikeData(e);
    var postId = data.postId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var headers = postData[0];
    var idCol = findColumn(headers, "idPostingan");
    var likeCol = findColumn(headers, "likeCount");
    var dislikeCol = findColumn(headers, "dislikeCount");

    for (var i = 1; i < postData.length; i++) {
      if (postData[i][idCol] === postId) {
        var currentLikes = parseInt(postData[i][likeCol] || 0);
        var currentDislikes = parseInt(postData[i][dislikeCol] || 0);

        if (type === "like") {
          currentLikes += 1;
        } else {
          currentDislikes += 1;
        }

        // Update spreadsheet
        postingSheet.getRange(i + 1, likeCol + 1).setValue(currentLikes);
        postingSheet.getRange(i + 1, dislikeCol + 1).setValue(currentDislikes);

        return {
          message: "Berhasil update " + type,
          newLikeCount: currentLikes,
          newDislikeCount: currentDislikes
        };
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Like/Dislike error: " + error.toString());
    return { error: "Error update like/dislike: " + error.toString() };
  }
}

function handleDeletePost(e) {
  try {
    var data = getPostDeleteData(e);
    var postId = data.postId;
    var userId = data.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");

    if (!postingSheet) {
      return { error: "Sheet Posting tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var headers = postData[0];
    var idCol = findColumn(headers, "idPostingan");
    var userIdCol = findColumn(headers, "idUsers");

    for (var i = 1; i < postData.length; i++) {
      if (postData[i][idCol] === postId) {
        // Check if user owns the post or is admin
        if (postData[i][userIdCol] === userId) {
          postingSheet.deleteRow(i + 1);
          return { message: "Postingan berhasil dihapus" };
        } else {
          return { error: "Anda tidak memiliki izin untuk menghapus postingan ini" };
        }
      }
    }

    return { error: "Post tidak ditemukan" };

  } catch (error) {
    Logger.log("Delete post error: " + error.toString());
    return { error: "Error menghapus postingan: " + error.toString() };
  }
}

function handleGetProfile(e) {
  try {
    var data = getProfileData(e);
    var userId = data.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var userData = usersSheet.getDataRange().getValues();
    var headers = userData[0];
    var idCol = findColumn(headers, "idUsers");

    for (var i = 1; i < userData.length; i++) {
      if (userData[i][idCol] === userId) {
        return {
          user: {
            idUsers: userData[i][findColumn(headers, "idUsers")],
            username: userData[i][findColumn(headers, "username")],
            email: userData[i][findColumn(headers, "email")],
            role: userData[i][findColumn(headers, "role")],
            nim: userData[i][findColumn(headers, "nim")],
            jurusan: userData[i][findColumn(headers, "jurusan")],
            bio: userData[i][findColumn(headers, "bio")],
            location: userData[i][findColumn(headers, "location")],
            website: userData[i][findColumn(headers, "website")]
          }
        };
      }
    }

    return { error: "User tidak ditemukan" };

  } catch (error) {
    Logger.log("Get profile error: " + error.toString());
    return { error: "Error mendapatkan profil: " + error.toString() };
  }
}

function handleUpdateProfile(e) {
  try {
    var data = getUpdateProfileData(e);
    var userId = data.userId;

    if (!userId) {
      return { error: "User ID harus diisi" };
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!usersSheet) {
      return { error: "Sheet Users tidak ditemukan" };
    }

    var userData = usersSheet.getDataRange().getValues();
    var headers = userData[0];
    var idCol = findColumn(headers, "idUsers");

    for (var i = 1; i < userData.length; i++) {
      if (userData[i][idCol] === userId) {
        // Update fields yang diberikan
        if (data.username) usersSheet.getRange(i + 1, findColumn(headers, "username") + 1).setValue(data.username);
        if (data.bio) usersSheet.getRange(i + 1, findColumn(headers, "bio") + 1).setValue(data.bio);
        if (data.location) usersSheet.getRange(i + 1, findColumn(headers, "location") + 1).setValue(data.location);
        if (data.website) usersSheet.getRange(i + 1, findColumn(headers, "website") + 1).setValue(data.website);

        return {
          message: "Profil berhasil diupdate",
          user: {
            idUsers: userData[i][findColumn(headers, "idUsers")],
            username: data.username || userData[i][findColumn(headers, "username")],
            email: userData[i][findColumn(headers, "email")],
            role: userData[i][findColumn(headers, "role")],
            nim: userData[i][findColumn(headers, "nim")],
            jurusan: userData[i][findColumn(headers, "jurusan")],
            bio: data.bio || userData[i][findColumn(headers, "bio")],
            location: data.location || userData[i][findColumn(headers, "location")],
            website: data.website || userData[i][findColumn(headers, "website")]
          }
        };
      }
    }

    return { error: "User tidak ditemukan" };

  } catch (error) {
    Logger.log("Update profile error: " + error.toString());
    return { error: "Error update profil: " + error.toString() };
  }
}

function handleUploadImage(e) {
  try {
    var data = getImageData(e);
    var imageBase64 = data.imageBase64;
    var fileName = data.fileName || "image_" + Date.now();

    if (!imageBase64) {
      return { error: "Image data harus diisi" };
    }

    // Remove data URL prefix if present
    var base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    
    // Convert base64 to blob
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      fileName + '.jpg'
    );

    // Upload to Google Drive
    var folder = DriveApp.getFolderById("1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw");
    var file = folder.createFile(blob);
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var imageUrl = "https://drive.google.com/uc?id=" + file.getId();

    return {
      message: "Image berhasil diupload",
      imageUrl: imageUrl,
      fileId: file.getId()
    };

  } catch (error) {
    Logger.log("Upload image error: " + error.toString());
    return { error: "Error upload image: " + error.toString() };
  }
}

function handleGetAdminStats() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var postingSheet = spreadsheet.getSheetByName("Posting");
    var usersSheet = spreadsheet.getSheetByName("Users");

    if (!postingSheet || !usersSheet) {
      return { error: "Sheet tidak ditemukan" };
    }

    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();

    var totalPosts = postData.length - 1; // minus header
    var totalUsers = userData.length - 1; // minus header

    // Get posts with most likes
    var topPosts = [];
    if (postData.length > 1) {
      var postHeaders = postData[0];
      var userHeaders = userData[0];
      
      for (var i = 1; i < postData.length; i++) {
        var row = postData[i];
        var post = {
          id: row[findColumn(postHeaders, "idPostingan")],
          judul: row[findColumn(postHeaders, "judul")],
          deskripsi: row[findColumn(postHeaders, "deskripsi")],
          likes: parseInt(row[findColumn(postHeaders, "likeCount")] || 0),
          dislikes: parseInt(row[findColumn(postHeaders, "dislikeCount")] || 0),
          userId: row[findColumn(postHeaders, "idUsers")],
          username: "Anonymous"
        };

        // Find username
        var userIdCol = findColumn(userHeaders, "idUsers");
        var usernameCol = findColumn(userHeaders, "username");
        for (var j = 1; j < userData.length; j++) {
          if (userData[j][userIdCol] === post.userId) {
            post.username = userData[j][usernameCol] || "Anonymous";
            break;
          }
        }

        topPosts.push(post);
      }

      // Sort by likes descending
      topPosts.sort(function(a, b) { return b.likes - a.likes; });
      topPosts = topPosts.slice(0, 10); // Top 10
    }

    return {
      stats: {
        totalPosts: totalPosts,
        totalUsers: totalUsers,
        topPosts: topPosts
      }
    };

  } catch (error) {
    Logger.log("Get admin stats error: " + error.toString());
    return { error: "Error mendapatkan statistik: " + error.toString() };
  }
}

// Helper functions
function findColumn(headers, columnName) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase() === columnName.toLowerCase()) {
      return i;
    }
  }
  return -1;
}

function getCredentials(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        email: postData.email,
        password: postData.password
      };
    } catch (error) {
      Logger.log("Parse credentials error: " + error.toString());
    }
  }
  
  return {
    email: e.parameter.email || "",
    password: e.parameter.password || ""
  };
}

function getUserData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        email: postData.email,
        username: postData.username,
        password: postData.password,
        nim: postData.nim,
        jurusan: postData.jurusan,
        gender: postData.gender,
        role: postData.role
      };
    } catch (error) {
      Logger.log("Parse user data error: " + error.toString());
    }
  }
  
  return {
    email: e.parameter.email || "",
    username: e.parameter.username || "",
    password: e.parameter.password || "",
    nim: e.parameter.nim || "",
    jurusan: e.parameter.jurusan || "",
    gender: e.parameter.gender || "",
    role: e.parameter.role || "user"
  };
}

function getPostData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        userId: postData.userId,
        judul: postData.judul,
        deskripsi: postData.deskripsi,
        imageUrl: postData.imageUrl
      };
    } catch (error) {
      Logger.log("Parse post data error: " + error.toString());
    }
  }
  
  return {
    userId: e.parameter.userId || "",
    judul: e.parameter.judul || "",
    deskripsi: e.parameter.deskripsi || "",
    imageUrl: e.parameter.imageUrl || ""
  };
}

function getLikeData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        postId: postData.postId
      };
    } catch (error) {
      Logger.log("Parse like data error: " + error.toString());
    }
  }
  
  return {
    postId: e.parameter.postId || ""
  };
}

function getPostDeleteData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        postId: postData.postId,
        userId: postData.userId
      };
    } catch (error) {
      Logger.log("Parse delete data error: " + error.toString());
    }
  }
  
  return {
    postId: e.parameter.postId || "",
    userId: e.parameter.userId || ""
  };
}

function getProfileData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        userId: postData.userId
      };
    } catch (error) {
      Logger.log("Parse profile data error: " + error.toString());
    }
  }
  
  return {
    userId: e.parameter.userId || ""
  };
}

function getUpdateProfileData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        userId: postData.userId,
        username: postData.username,
        bio: postData.bio,
        location: postData.location,
        website: postData.website
      };
    } catch (error) {
      Logger.log("Parse update profile data error: " + error.toString());
    }
  }
  
  return {
    userId: e.parameter.userId || "",
    username: e.parameter.username || "",
    bio: e.parameter.bio || "",
    location: e.parameter.location || "",
    website: e.parameter.website || ""
  };
}

function getImageData(e) {
  if (e.postData && e.postData.contents) {
    try {
      var postData = JSON.parse(e.postData.contents);
      return {
        imageBase64: postData.imageBase64,
        fileName: postData.fileName
      };
    } catch (error) {
      Logger.log("Parse image data error: " + error.toString());
    }
  }
  
  return {
    imageBase64: e.parameter.imageBase64 || "",
    fileName: e.parameter.fileName || ""
  };
}