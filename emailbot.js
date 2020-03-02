const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
var parseMessage = require("./gmail.parser");
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './bottoken/gmail.token.json';
var labelFilter = "xolo";
function gmailOperator() {
  this.auth = null;
  this.labelid = null;
  this.init = function () {
    // Load client secrets from a local file.
    fs.readFile('./bottoken/gmail.credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Gmail API.
      authorize(JSON.parse(content), (auth) => {
        this.auth = auth;
        listLabels(this.auth, (lables) => {
          // console.log(lables)
          var xolo = lables.find(p => p.name.toLowerCase().indexOf(labelFilter) > -1);
          if (xolo != null) {
            this.labelid = xolo.id;
          }
          else {
            throw new Error("请在邮箱内配置xolo标签")
          }

        })
        //listLabels(this.auth)
      });
    });

  }

  this.getLastTokenEmail = function (callback) {

    watchIncomeEmail(this.auth, this.labelid, (message) => {
      if (message.length) {
        getEmail(this.auth, message[0].id, callback);
      }
      else {
        callback("")
      }

    });
  }

  this.init();

  return this;
}




/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth, callback) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      //console.log('Labels:');
      labels.forEach((label) => {
        // console.log(`${label.id}- ${label.name}`);
      });
      callback(labels)
    } else {
      //console.log('No labels found.');
    }
  });
}

function watchIncomeEmail(auth, labelId, callback) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.messages.list({
    userId: "me",
    labelIds: [labelId]
  }, (err, res) => {

    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.messages || [];
    //console.log(labels)
    if (labels != null && labels.length) {
      // console.log('Labels:');
      labels.forEach((label) => {
        // console.log(`- ${JSON.stringify(label)}`);
      });

    }
    callback(labels)

  })
}

function getEmail(auth, emialId, callback) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.messages.get({
    userId: "me",
    id: emialId,

  }, (err, res) => {

    if (err) return console.log('The API returned an error: ' + err);
    //console.log(res)
    var parsedMessage = parseMessage(res.data);
    var link = "";
    var list = parsedMessage.textPlain.split(/\r\n|\n/);
    for (var i = 0; i < list.length; ++i) {
      if (list[i].indexOf("https") > -1) {
        link = list[i];
        break;
      }
    }
    callback(link);
    //console.log(link.trim())
    //console.log(parsedMessage);
    //console.log(res.data.payload.parts)

  })
}

module.exports = new gmailOperator();