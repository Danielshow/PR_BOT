const axios = require("axios");
const config = require("../config");

const sendDirectMessage = async (userId, message, attachments = []) => {
  try {
    const res = await axios.post(
      "https://slack.com/api/conversations.open",
      { users: userId },
      {
        headers: {
          Authorization: `Bearer ${config.botToken}`,
        },
      }
    );
    const channel = res.data.channel.id;
    const data = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel,
        text: message,
        attachments: JSON.stringify(attachments),
      },
      {
        headers: { Authorization: `Bearer ${config.botToken}` },
      }
    );
  } catch (err) {
    console.log(err)
  }
};

const sendMessageToChannel = async (channel, message, attachments = []) => {
  try {
    const res = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel,
        text: message,
        attachments: JSON.stringify(attachments),
      },
      {
        headers: { Authorization: `Bearer ${config.botToken}` },
      }
    );
  } catch (err) {
    console.log(err)
  }
};

module.exports = {
  sendDirectMessage,
  sendMessageToChannel,
};
