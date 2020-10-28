const admin = require("firebase-admin");
const moment = require("moment");

const serviceAccount = require("../keys/prbot-automation-firebase-adminsdk-bsnlm-a8e334beee.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prbot-automation.firebaseio.com/",
});

const db = admin.database();
const ref = db.ref("/");

const saveUserWhoUnsubscribed = ({
  user_id,
}) => {
  const newData = ref.push({
    user_id,
    timestamp: moment().valueOf(),
  });
  return newData.key;
};

const deleteUserWhoUnsubscribed = async (id) => {
  let userKey = ''
  const snapShot = await ref.once("value");
  const allUnsubscribedUser = snapShot.val() || {};
  for (let key of Object.keys(allUnsubscribedUser)) {
    const user = allUnsubscribedUser[key];
    const { user_id } = user;
    if (id == user_id) userKey = key;
  }
  if (userKey) ref.child(userKey).remove();
  return;
};

const checkIfUserHasUnsubscribed = async (id) => {
  const snapShot = await ref.once("value");
  const allUnsubscribedUser = snapShot.val() || [];
  for (let key of Object.keys(allUnsubscribedUser)) {
    const user = allUnsubscribedUser[key];
    const { user_id } = user;
    if (id == user_id) return key;
  }
  return false;
}

const saveFeedback = ({
  user_id,
  feedback
}) => {
  const newData = feedback.push({
    user_id,
    feedback,
    timestamp: moment().valueOf(),
  });
  return newData.key;
};

const getAllFeedback = async () => {
  const snapShot = await feedback.once("value");
  return snapShot.val()
};

module.exports = {
  saveUserWhoUnsubscribed,
  deleteUserWhoUnsubscribed,
  checkIfUserHasUnsubscribed,
  saveFeedback,
  getAllFeedback,
};
