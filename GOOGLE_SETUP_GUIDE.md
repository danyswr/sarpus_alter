# FeedbackU Google Integration Setup Guide

This guide will help you set up the Google Apps Script backend and Google Drive integration for your FeedbackU platform.

## Step 1: Create Google Spreadsheet Database

1. **Create a new Google Spreadsheet:**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click "Blank" to create a new spreadsheet
   - Name it "FeedbackU Database"

2. **Note the Spreadsheet ID:**
   - The ID is in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy this ID for later use

## Step 2: Create Google Drive Folder for Images

1. **Create a new folder in Google Drive:**
   - Go to [Google Drive](https://drive.google.com)
   - Click "New" → "Folder"
   - Name it "FeedbackU Images"

2. **Make the folder publicly accessible:**
   - Right-click the folder → "Share"
   - Click "Change to anyone with the link"
   - Set permission to "Viewer"
   - Click "Done"

3. **Get the Folder ID:**
   - Open the folder
   - The ID is in the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
   - Copy this ID

## Step 3: Set Up Google Apps Script

1. **Create a new Apps Script project:**
   - Go to [Google Apps Script](https://script.google.com)
   - Click "New Project"
   - Name it "FeedbackU Backend"

2. **Replace the default code:**
   - Delete all content in `Code.gs`
   - Copy and paste the entire content from the `Code.gs` file in this project

3. **Update configuration:**
   - In the `Code.gs` file, find this line:
   ```javascript
   const DRIVE_FOLDER_ID = '1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw';
   ```
   - Replace with your folder ID:
   ```javascript
   const DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID_HERE';
   ```

4. **Bind to your spreadsheet:**
   - In Apps Script, click "Resources" → "Libraries" (or "Extensions" → "Apps Script" in newer interface)
   - Go to "Resources" → "Cloud Platform project"
   - Enable the following APIs:
     - Google Sheets API
     - Google Drive API

5. **Set up spreadsheet binding:**
   - Click on "Resources" → "Cloud Platform project"
   - Click "Change project"
   - Create a new project or select existing one
   - Go back to your script
   - Click "File" → "Project properties"
   - Note the Script ID

## Step 4: Initialize the Database

1. **Run the setup function:**
   - In Apps Script editor, select `setupSpreadsheet` from the function dropdown
   - Click the "Run" button (play icon)
   - Authorize the script when prompted
   - This will create the required sheets and add a sample admin user

2. **Verify the setup:**
   - Go back to your Google Spreadsheet
   - You should see two new sheets: "Users" and "Posts"
   - The Users sheet should have headers and one admin user

## Step 5: Deploy the Web App

1. **Deploy as web app:**
   - In Apps Script, click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Description: "FeedbackU API v1"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"

2. **Copy the Web App URL:**
   - You'll get a URL like: `https://script.google.com/macros/s/SCRIPT_ID/exec`
   - Copy this URL

3. **Update the frontend configuration:**
   - In your project, open `client/src/lib/api.ts`
   - Find this line:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";
   ```
   - Replace with your Web App URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = "YOUR_WEB_APP_URL_HERE";
   ```

## Step 6: Test the Integration

1. **Test the connection:**
   - Open your FeedbackU application
   - Try to register a new user
   - Try to login with the default admin account:
     - Email: `admin@admin.admin`
     - Password: `admin123`

2. **Test posting:**
   - Create a new post
   - Upload an image
   - Try liking/disliking posts

3. **Verify data storage:**
   - Check your Google Spreadsheet to see if data is being saved
   - Check your Google Drive folder for uploaded images

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Make sure your Web App is deployed with "Anyone" access
   - Re-deploy if you made changes to the script

2. **Authorization Issues:**
   - Run the `setupSpreadsheet` function manually first
   - Make sure all required permissions are granted

3. **Image Upload Not Working:**
   - Verify the Drive folder ID is correct
   - Make sure the folder has public sharing enabled
   - Check that the Drive API is enabled

4. **Data Not Saving:**
   - Check the Apps Script execution logs for errors
   - Verify the spreadsheet binding is correct
   - Make sure the Sheets API is enabled

### Testing the API Directly:

You can test your Google Apps Script API using these URLs:

```
# Test connection
https://YOUR_SCRIPT_URL?action=test

# Get posts
https://YOUR_SCRIPT_URL?action=getPosts
```

## Security Considerations

1. **Password Security:**
   - The current setup stores passwords in plain text for simplicity
   - For production, consider implementing password hashing

2. **Access Control:**
   - The current setup allows anyone to access the API
   - Consider implementing API key authentication for production

3. **Data Validation:**
   - The script includes basic validation
   - Consider adding more robust input validation for production

## Admin Account

Default admin credentials for testing:
- **Email:** `admin@admin.admin`
- **Password:** `admin123`
- **Username:** `Admin User`
- **Role:** `admin`

You can change these credentials by editing the `setupSpreadsheet` function in your Apps Script.