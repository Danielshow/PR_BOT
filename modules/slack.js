const axios = require('axios');
const config = require('../config');

const sendDirectMessage = async (userId, message, attachments=[]) => {
  try {
    const res = await axios.post('https://slack.com/api/conversations.open', 
      { users: userId },
      { headers: {
          Authorization: `Bearer ${config.botToken}`
        }
      }
    )
    const channel = res.data.channel.id;
    await axios.post('https://slack.com/api/chat.postMessage', 
      {
        channel,
        text: message,
        attachments: JSON.stringify(attachments)
      },
      {
        headers: { Authorization: `Bearer ${config.botToken}`}
      }
    );

  } catch (err) {
    throw err
  }
}

const sendMessageToChannel = async (channel, message, attachments=[]) => {
  try {
    await axios.post('https://slack.com/api/chat.postMessage', 
      {
        channel,
        text: message,
        attachments: JSON.stringify(attachments)
      },
      {
        headers: { Authorization: `Bearer ${config.botToken}`}
      }
    );

  } catch (err) {
    throw err;
  }
}

module.exports = {
  sendDirectMessage
}
