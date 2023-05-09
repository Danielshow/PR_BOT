import sendOpenPullRequestToChannel from './modules/cronJob.js';
import { prReviews } from './modules/reviews.js';
import dotenv from 'dotenv'

dotenv.config()
const pr_bot_run = async (event, context) => {
  const time = new Date();
  await sendOpenPullRequestToChannel()
  await prReviews();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);
};

export { pr_bot_run };