/**
 * UPDATED Google Apps Script dengan DELETE POST functionality
 * Menambahkan handleDeletePost function yang hilang
 */

// Tambahkan case untuk deletePost dalam switch statement
function handleRequest(e) {
  // ... existing code ...
  
  switch(action) {
    // ... existing cases ...
    case "deletePost":
      result = handleDeletePost(e);
      break;
    // ... rest of existing cases ...
  }
  
  // ... rest of existing code ...
}

// Tambahkan function handleDeletePost yang hilang
function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId || deleteData.adminId;

    if (!postId) {
      return { error: "Post ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");
    var postData = postingSheet.getDataRange().getValues();
    var userData = usersSheet.getDataRange().getValues();
    
    var postRow = -1;
    var postOwnerId = null;
    var userRow = -1;
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

    // Cek apakah user adalah admin atau pemilik post
    for (var j = 1; j < userData.length; j++) {
      if (userData[j][0] === userId) {
        userRow = j + 1;
        isAdmin = (userData[j][7] === "admin" || userData[j][7] === "Admin");
        break;
      }
    }

    // Validasi permission
    if (!isAdmin && postOwnerId !== userId) {
      return { error: "Anda tidak memiliki izin untuk menghapus post ini" };
    }

    // Hapus post dari sheet
    postingSheet.deleteRow(postRow);

    // Hapus interactions terkait post ini
    deletePostInteractions(postId);

    // Hapus comments terkait post ini
    deletePostComments(postId);

    return {
      message: isAdmin ? "Post berhasil dihapus oleh admin" : "Post berhasil dihapus",
      success: true,
      postId: postId,
      deletedBy: isAdmin ? "admin" : "owner"
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
        userId: data.userId,
        adminId: data.adminId
      };
    }
    
    if (e.parameter) {
      return {
        postId: e.parameter.postId,
        userId: e.parameter.userId,
        adminId: e.parameter.adminId
      };
    }
    
    return {};
  } catch (error) {
    Logger.log("Get delete post data error: " + error.toString());
    return {};
  }
}