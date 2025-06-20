/**
 * ADD THIS TO YOUR GOOGLE APPS SCRIPT
 * Tambahkan fungsi deletePost untuk admin dan pemilik post
 */

// Tambahkan case ini di switch statement handleRequest():
case "deletePost":
  result = handleDeletePost(e);
  break;

// Tambahkan fungsi handleDeletePost:
function handleDeletePost(e) {
  try {
    var deleteData = getDeletePostData(e);
    var postId = deleteData.postId;
    var userId = deleteData.userId;

    if (!postId || !userId) {
      return { error: "Post ID dan User ID harus diisi" };
    }

    var postingSheet = getSheet("Posting");
    var usersSheet = getSheet("Users");
    var postData = postingSheet.getDataRange().getValues();
    var postRow = -1;
    var postOwnerId = null;

    // Cari post
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

    // Cek role user
    var userData = usersSheet.getDataRange().getValues();
    var userRole = null;
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][0] === userId) {
        userRole = userData[i][7]; // Role ada di kolom ke-8 (index 7)
        break;
      }
    }

    // Cek permission: pemilik post atau admin
    var isOwner = postOwnerId === userId;
    var isAdmin = userRole === "Admin" || userRole === "admin";

    if (!isOwner && !isAdmin) {
      return { error: "Tidak memiliki izin untuk menghapus post ini" };
    }

    // Hapus interactions terkait post
    deletePostInteractions(postId);
    
    // Hapus comments terkait post
    deletePostComments(postId);

    // Hapus post
    postingSheet.deleteRow(postRow);

    return {
      message: "Post berhasil dihapus",
      postId: postId,
      deletedBy: userId,
      isAdmin: isAdmin
    };
  } catch (error) {
    Logger.log("Delete post error: " + error.toString());
    return { error: "Error menghapus post: " + error.toString() };
  }
}

// Tambahkan fungsi helper:
function deletePostInteractions(postId) {
  try {
    var interactionsSheet = getSheet("UserInteractions");
    var data = interactionsSheet.getDataRange().getValues();
    
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === postId) {
        interactionsSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    Logger.log("Error deleting interactions: " + error.toString());
  }
}

function deletePostComments(postId) {
  try {
    var commentsSheet = getSheet("Comments");
    var data = commentsSheet.getDataRange().getValues();
    
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === postId) {
        commentsSheet.deleteRow(i + 1);
      }
    }
  } catch (error) {
    Logger.log("Error deleting comments: " + error.toString());
  }
}

function getDeletePostData(e) {
  try {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      return {
        postId: data.postId,
        userId: data.userId
      };
    } else if (e.parameter) {
      return {
        postId: e.parameter.postId,
        userId: e.parameter.userId
      };
    }
    return {};
  } catch (error) {
    Logger.log("Error parsing delete post data: " + error.toString());
    return {};
  }
}