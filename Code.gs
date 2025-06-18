/**
 * FeedbackU - Google Apps Script Backend
 * Handles data storage in Google Sheets and file uploads to Google Drive
 */

// Configuration
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const DRIVE_FOLDER_ID = '1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw'; // Google Drive folder ID untuk menyimpan gambar

// Sheet names
const USERS_SHEET = 'Users';
const POSTS_SHEET = 'Posts';

/**
 * Main function to handle all API requests
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    Logger.log('Request received: ' + JSON.stringify(e));
    
    // Get parameters from either URL or POST body
    let params = e.parameter || {};
    
    // Handle POST data dari FormData
    if (e.postData && e.postData.type === 'application/x-www-form-urlencoded') {
      const postParams = parseFormData(e.postData.contents);
      params = { ...params, ...postParams };
    }
    
    // Handle JSON POST data (fallback)
    if (e.postData && e.postData.contents && e.postData.type === 'application/json') {
      try {
        const postData = JSON.parse(e.postData.contents);
        params = { ...params, ...postData };
      } catch (err) {
        Logger.log('Error parsing JSON POST data: ' + err);
      }
    }

    const action = params.action;
    Logger.log('Action: ' + action);
    Logger.log('Params: ' + JSON.stringify(params));

    let result = {};

    switch (action) {
      case 'test':
        result = testConnection();
        break;
      case 'register':
        result = registerUser(params);
        break;
      case 'login':
        result = loginUser(params);
        break;
      case 'getPosts':
        result = getPosts();
        break;
      case 'createPost':
        result = createPost(params);
        break;
      case 'likeDislike':
        result = likeDislikePost(params);
        break;
      case 'deletePost':
        result = deletePost(params);
        break;
      case 'updateProfile':
        result = updateProfile(params);
        break;
      case 'uploadImage':
        result = uploadImage(params);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    Logger.log('Result: ' + JSON.stringify(result));
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.toString());
    const errorResponse = {
      error: 'Server error: ' + error.toString(),
      stack: error.stack
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      });
  }
}

/**
 * Parse FormData dari POST request
 */
function parseFormData(data) {
  const params = {};
  const pairs = data.split('&');
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    if (pair.length === 2) {
      const key = decodeURIComponent(pair[0]);
      const value = decodeURIComponent(pair[1]);
      params[key] = value;
    }
  }
  
  return params;
}

/**
 * Test connection function
 */
function testConnection() {
  return {
    message: 'Connection successful',
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID
  };
}

/**
 * Initialize spreadsheet with required sheets and headers
 */
function initializeSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Users sheet
  let usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
  if (!usersSheet) {
    usersSheet = spreadsheet.insertSheet(USERS_SHEET);
    usersSheet.getRange(1, 1, 1, 8).setValues([[
      'idUsers', 'username', 'email', 'password', 'nim', 'jurusan', 'role', 'createdAt'
    ]]);
  }
  
  // Create Posts sheet
  let postsSheet = spreadsheet.getSheetByName(POSTS_SHEET);
  if (!postsSheet) {
    postsSheet = spreadsheet.insertSheet(POSTS_SHEET);
    postsSheet.getRange(1, 1, 1, 10).setValues([[
      'idPostingan', 'idUsers', 'judul', 'deskripsi', 'imageUrl', 'likes', 'dislikes', 'likedBy', 'dislikedBy', 'timestamp'
    ]]);
  }
}

/**
 * Register a new user
 */
function registerUser(params) {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    
    // Check if email already exists
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === params.email) { // email column
        return { error: 'Email sudah terdaftar' };
      }
    }
    
    // Generate unique user ID
    const idUsers = 'USER' + Date.now();
    
    // Determine role based on email
    const role = params.email.includes('admin') ? 'admin' : 'user';
    
    // Add new user
    const newRow = [
      idUsers,
      params.username,
      params.email,
      params.password, // In production, hash this password
      params.nim || '',
      params.jurusan || '',
      role,
      new Date().toISOString()
    ];
    
    usersSheet.appendRow(newRow);
    
    return {
      message: 'Registrasi berhasil',
      idUsers: idUsers,
      username: params.username,
      email: params.email,
      role: role,
      nim: params.nim || '',
      jurusan: params.jurusan || ''
    };
    
  } catch (error) {
    Logger.log('Error in registerUser: ' + error);
    return { error: 'Gagal mendaftarkan user: ' + error.toString() };
  }
}

/**
 * Login user
 */
function loginUser(params) {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    
    const data = usersSheet.getDataRange().getValues();
    
    // Find user by email
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === params.email) { // email column
        if (row[3] === params.password) { // password column
          return {
            message: 'Login berhasil',
            idUsers: row[0],
            username: row[1],
            email: row[2],
            nim: row[4],
            jurusan: row[5],
            role: row[6] || 'user'
          };
        } else {
          return { error: 'Password salah' };
        }
      }
    }
    
    return { error: 'Email tidak ditemukan' };
    
  } catch (error) {
    Logger.log('Error in loginUser: ' + error);
    return { error: 'Gagal login: ' + error.toString() };
  }
}

/**
 * Get all posts with user information
 */
function getPosts() {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const postsSheet = spreadsheet.getSheetByName(POSTS_SHEET);
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    
    const postsData = postsSheet.getDataRange().getValues();
    const usersData = usersSheet.getDataRange().getValues();
    
    // Create user lookup map
    const userMap = {};
    for (let i = 1; i < usersData.length; i++) {
      const userRow = usersData[i];
      userMap[userRow[0]] = userRow[1]; // idUsers -> username
    }
    
    const posts = [];
    for (let i = 1; i < postsData.length; i++) {
      const row = postsData[i];
      if (row[0]) { // Check if idPostingan exists
        posts.push({
          idPostingan: row[0],
          idUsers: row[1],
          judul: row[2],
          deskripsi: row[3],
          imageUrl: row[4] || '',
          likes: parseInt(row[5]) || 0,
          dislikes: parseInt(row[6]) || 0,
          likedBy: row[7] ? row[7].split(',').filter(id => id) : [],
          dislikedBy: row[8] ? row[8].split(',').filter(id => id) : [],
          timestamp: row[9],
          username: userMap[row[1]] || 'Unknown User'
        });
      }
    }
    
    // Sort by timestamp (newest first)
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return posts;
    
  } catch (error) {
    Logger.log('Error in getPosts: ' + error);
    return { error: 'Gagal mengambil posts: ' + error.toString() };
  }
}

/**
 * Create a new post
 */
function createPost(params) {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const postsSheet = spreadsheet.getSheetByName(POSTS_SHEET);
    
    const idPostingan = 'POST' + Date.now();
    
    const newRow = [
      idPostingan,
      params.idUsers,
      params.judul || 'Post',
      params.deskripsi,
      params.imageUrl || '',
      0, // likes
      0, // dislikes
      '', // likedBy
      '', // dislikedBy
      new Date().toISOString()
    ];
    
    postsSheet.appendRow(newRow);
    
    return {
      message: 'Postingan berhasil dibuat',
      idPostingan: idPostingan
    };
    
  } catch (error) {
    Logger.log('Error in createPost: ' + error);
    return { error: 'Gagal membuat post: ' + error.toString() };
  }
}

/**
 * Like or dislike a post
 */
function likeDislikePost(params) {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const postsSheet = spreadsheet.getSheetByName(POSTS_SHEET);
    
    const data = postsSheet.getDataRange().getValues();
    
    // Find post by idPostingan
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.idPostingan) {
        let likes = parseInt(data[i][5]) || 0;
        let dislikes = parseInt(data[i][6]) || 0;
        let likedBy = data[i][7] ? data[i][7].split(',').filter(id => id) : [];
        let dislikedBy = data[i][8] ? data[i][8].split(',').filter(id => id) : [];
        
        const userLiked = likedBy.includes(params.idUsers);
        const userDisliked = dislikedBy.includes(params.idUsers);
        
        if (params.type === 'like') {
          if (userLiked) {
            // Remove like
            likedBy = likedBy.filter(id => id !== params.idUsers);
            likes--;
          } else {
            // Add like and remove dislike if exists
            likedBy.push(params.idUsers);
            likes++;
            if (userDisliked) {
              dislikedBy = dislikedBy.filter(id => id !== params.idUsers);
              dislikes--;
            }
          }
        } else if (params.type === 'dislike') {
          if (userDisliked) {
            // Remove dislike
            dislikedBy = dislikedBy.filter(id => id !== params.idUsers);
            dislikes--;
          } else {
            // Add dislike and remove like if exists
            dislikedBy.push(params.idUsers);
            dislikes++;
            if (userLiked) {
              likedBy = likedBy.filter(id => id !== params.idUsers);
              likes--;
            }
          }
        }
        
        // Update the sheet
        postsSheet.getRange(i + 1, 6).setValue(likes);
        postsSheet.getRange(i + 1, 7).setValue(dislikes);
        postsSheet.getRange(i + 1, 8).setValue(likedBy.join(','));
        postsSheet.getRange(i + 1, 9).setValue(dislikedBy.join(','));
        
        return {
          message: 'Berhasil update like/dislike',
          likes: likes,
          dislikes: dislikes
        };
      }
    }
    
    return { error: 'Post tidak ditemukan' };
    
  } catch (error) {
    Logger.log('Error in likeDislikePost: ' + error);
    return { error: 'Gagal update like/dislike: ' + error.toString() };
  }
}

/**
 * Delete a post
 */
function deletePost(params) {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const postsSheet = spreadsheet.getSheetByName(POSTS_SHEET);
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    
    const postsData = postsSheet.getDataRange().getValues();
    const usersData = usersSheet.getDataRange().getValues();
    
    // Find user role
    let userRole = 'user';
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0] === params.idUsers) {
        userRole = usersData[i][6] || 'user';
        break;
      }
    }
    
    // Find and delete post
    for (let i = 1; i < postsData.length; i++) {
      if (postsData[i][0] === params.idPostingan) {
        // Check permissions
        if (postsData[i][1] === params.idUsers || userRole === 'admin') {
          postsSheet.deleteRow(i + 1);
          return { message: 'Post berhasil dihapus' };
        } else {
          return { error: 'Tidak ada izin untuk menghapus post ini' };
        }
      }
    }
    
    return { error: 'Post tidak ditemukan' };
    
  } catch (error) {
    Logger.log('Error in deletePost: ' + error);
    return { error: 'Gagal menghapus post: ' + error.toString() };
  }
}

/**
 * Update user profile
 */
function updateProfile(params) {
  try {
    initializeSpreadsheet();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    
    const data = usersSheet.getDataRange().getValues();
    
    // Find user by idUsers
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.idUsers) {
        // Update user data
        if (params.username) usersSheet.getRange(i + 1, 2).setValue(params.username);
        if (params.email) usersSheet.getRange(i + 1, 3).setValue(params.email);
        if (params.nim) usersSheet.getRange(i + 1, 5).setValue(params.nim);
        if (params.jurusan) usersSheet.getRange(i + 1, 6).setValue(params.jurusan);
        
        return { message: 'Profile berhasil diupdate' };
      }
    }
    
    return { error: 'User tidak ditemukan' };
    
  } catch (error) {
    Logger.log('Error in updateProfile: ' + error);
    return { error: 'Gagal update profile: ' + error.toString() };
  }
}

/**
 * Upload image to Google Drive
 */
function uploadImage(params) {
  try {
    if (!params.imageData || !params.fileName) {
      return { error: 'Data gambar atau nama file tidak valid' };
    }
    
    // Decode base64 image data
    const imageBlob = Utilities.newBlob(
      Utilities.base64Decode(params.imageData),
      params.mimeType || 'image/jpeg',
      params.fileName
    );
    
    // Get the target folder
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Upload file to drive
    const file = folder.createFile(imageBlob);
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return the public URL
    const imageUrl = 'https://drive.google.com/uc?id=' + file.getId();
    
    return {
      message: 'Gambar berhasil diupload',
      imageUrl: imageUrl,
      fileId: file.getId()
    };
    
  } catch (error) {
    Logger.log('Error in uploadImage: ' + error);
    return { error: 'Gagal upload gambar: ' + error.toString() };
  }
}

/**
 * Test function to initialize the spreadsheet manually
 */
function setupSpreadsheet() {
  initializeSpreadsheet();
  
  // Add sample admin user
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
  
  // Check if admin already exists
  const data = usersSheet.getDataRange().getValues();
  let adminExists = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'admin@admin.admin') {
      adminExists = true;
      break;
    }
  }
  
  if (!adminExists) {
    const adminRow = [
      'ADMIN123',
      'Admin User',
      'admin@admin.admin',
      'admin123',
      'ADM123456',
      'Teknik Informatika',
      'admin',
      new Date().toISOString()
    ];
    
    usersSheet.appendRow(adminRow);
  }
  
  // Add sample regular user
  let userExists = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'user@student.com') {
      userExists = true;
      break;
    }
  }
  
  if (!userExists) {
    const userRow = [
      'USER123',
      'Mahasiswa User',
      'user@student.com',
      'user123',
      'STD123456',
      'Sistem Informasi',
      'user',
      new Date().toISOString()
    ];
    
    usersSheet.appendRow(userRow);
  }
  
  Logger.log('Spreadsheet setup complete');
  return { message: 'Setup berhasil', adminUser: 'admin@admin.admin', regularUser: 'user@student.com' };
}