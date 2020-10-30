import axios from "axios";
import { checkIfUserHasUnsubscribed } from './database';

const botToken = process.env.botToken;
export const sendDirectMessage = async (userId, message, attachments = []) => {
  try {
    if (checkIfUserHasUnsubscribed(userId)) return
    const res = await axios.post(
      "https://slack.com/api/conversations.open",
      { users: userId },
      {
        headers: {
          Authorization: `Bearer ${botToken}`,
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
        headers: { Authorization: `Bearer ${botToken}` },
      }
    );
  } catch (err) {
    console.log(err)
  }
};

export const sendMessageToChannel = async (channel, message, attachments = []) => {
  try {
    const res = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel,
        text: message,
        attachments: JSON.stringify(attachments),
      },
      {
        headers: { Authorization: `Bearer ${botToken}` },
      }
    );
  } catch (err) {
    console.log(err)
  }
};

export const deleteMessage = async (channel, timestamp) => {
  const res = await axios.post(
    " https://slack.com/api/chat.delete",
    {
      channel,
      ts: timestamp
    },
    {
      headers: { Authorization: `Bearer ${botToken}` },
    }
  );
  console.log(res)
}

module.exports = {
  sendDirectMessage,
  sendMessageToChannel,
};
