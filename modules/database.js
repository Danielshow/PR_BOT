const admin = require("firebase-admin");
const moment = require("moment");

const serviceAccount = require("../keys/prbot-automation-firebase-adminsdk-bsnlm-a8e334beee.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prbot-automation.firebaseio.com/",
});

const db = admin.database();
const ref = db.ref("/");

const savePullRequest = ({
  user_id,
  pull_request_url,
  pull_id,
  status,
  labels,
  reviewers,
  pull_num,
  approval_status,
  approved_by,
  is_approved,
  approved_at
}) => {
  const newData = ref.push({
    user_id,
    pull_request_url,
    pull_id,
    status,
    labels,
    reviewers,
    pull_num,
    approval_status,
    approved_by,
    is_approved,
    approved_at
    timestamp: moment().valueOf(),
  });
  return newData.key;
};

const readPullRequest = async (key) => {
  const snapShot = await ref.child(key).once("value");
  return snapShot.val();
};

const updatePullRequestStatus = async (key, status) => {
  ref.child(key).update({ status });
};

const updatePullRequest = ({
  key,
  user_id,
  pull_request_url,
  pull_id,
  status,
  labels,
  reviewers,
  pull_num,
  approval_status,
  approved_by,
  is_approved,
  approved_at
}) => {
  ref.child(key).update({
    user_id,
    pull_request_url,
    pull_id,
    status,
    labels,
    reviewers,
    pull_num,
    approval_status,
    approved_by,
    is_approved,
    approved_at,
    timestamp: moment().valueOf(),
  });
};

const getAllPullRequest = async () => {
  const snapShot = await ref.once("value");
  return snapShot.val();
};

const deletePullRequest = (key) => {
  return ref.child(key).remove();
};

const checkIfPullRequestExist = async (id) => {
  const snapShot = await ref.once("value");
  const allPullRequest = snapShot.val() || [];
  for (let key of Object.keys(allPullRequest)) {
    const pull_request = allPullRequest[key];
    const { pull_id } = pull_request;
    if (id == pull_id) return key;
  }
  return false;
};

module.exports = {
  savePullRequest,
  readPullRequest,
  updatePullRequestStatus,
  getAllPullRequest,
  checkIfPullRequestExist,
  updatePullRequest,
  deletePullRequest,
};
