const admin = require("firebase-admin");
const moment = require('moment');

const serviceAccount = require("../keys/prbot-automation-firebase-adminsdk-bsnlm-a8e334beee.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prbot-automation.firebaseio.com/"
});

const db = admin.database();
const ref = db.ref('/');

const savePullRequest = (user_id, pull_request_url, pull_request_id, status) => {
  const newData = ref.push({user_id, pull_request_url, pull_request_id, status, timestamp: moment().valueOf()});
  return newData.key;
}

const readPullRequest = async (key) => {
  const snapShot = await ref.child(key).once('value');
  return snapShot.val()
}

const updatePullRequestStatus = async (key, status) => {
  ref.child(key).update({ status });
}

const getAllPullRequest = async () => {
  const snapShot = await ref.once('value');
  return snapShot.val()
}



module.exports = {
  savePullRequest,
  readPullRequest,
  updatePullRequestStatus,
  getAllPullRequest
}
