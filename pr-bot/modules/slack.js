import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const botToken = process.env.botToken;
export const sendDirectMessage = async (userId, message) => {
  if (!userId || userId === 'dependabot') {
    return;
  }
  try {
    const res = await axios.post(
      'https://slack.com/api/conversations.open',
      { users: userId },
      {
        headers: {
          Authorization: `Bearer ${botToken}`
        }
      }
    );
    const channel = res.data.channel.id;
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel,
        text: message
      },
      {
        headers: { Authorization: `Bearer ${botToken}` }
      }
    );
  } catch (err) {
    console.log(err);
  }
};

export const sendMessageToChannel = async (
  channel,
  message,
  attachments = []
) => {
  try {
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel,
        text: message,
        attachments: attachments
      },
      {
        headers: { Authorization: `Bearer ${botToken}` }
      }
    );
  } catch (err) {
    console.log(err);
  }
};