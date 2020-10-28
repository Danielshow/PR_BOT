import { checkIfUserHasUnsubscribed, saveUserWhoUnsubscribed, deleteUserWhoUnsubscribed, saveFeedback } from './database';

export default (app) => {
  app.post("/pr-bot", async (req, res) => {
    const text = req.body.text;
    const user_id = req.body.user_id;

    const [action = "", comment = ""] = text.split(" ");
    let message;
    switch (action.toLowerCase()) {
      case "subscribe":
        message = ":awesome: Thanks for subscribing, I will wow you !!!!!";
        break;
      case "unsubscribe":
        message = ":cry: I am sorry to see you go. Bye";
        break;
      default:
        message = "I don't understand your command";
        break;
    }
    res.json({
      text: message
    });

    // do something based on the action
    if (action.toLowerCase() == 'unsubscribe'){
        if (await checkIfUserHasUnsubscribed(user_id)) return
        saveUserWhoUnsubscribed({ user_id });
    } else if (action.toLowerCase() == 'subscribe') {
        deleteUserWhoUnsubscribed(user_id)
    }
  });
};
