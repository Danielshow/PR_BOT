import cron from "node-cron";
import moment from "moment";
import { Octokit } from "@octokit/core";
import { githubUserToSlack } from "../utils/constants";
import { sendMessageToChannel } from "./slack";

const octokit = new Octokit({ auth: process.env.GITJIRA_GIT_ACCESS_TOKEN });
// Get all Reviews for a PR
export const getAllReviews = async (number) => {
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO,
      pull_number: number,
    }
  );
  return data;
};

// Get all Pull request
export const getAllPullRequest = async (date = null) => {
  let { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls?sort=created&state=open&direction=desc",
    {
      owner: process.env.REPO_OWNER,
      repo: process.env.REPO,
    }
  );

  data = data.filter((dt) => date.isBefore(moment(dt.created_at)));
  await Promise.all(
    data.map(async (pr) => {
      const review = await getAllReviews(pr.number);
      pr.pr_review = review;
    })
  );
  return data;
};

const sendOpenPullRequestToChannel = async (channel = null) => {
  const pullRequests = await getAllPullRequest(moment().subtract(30, "days"));
  const formedString = [
    `++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    Recent Open Pull Requests                
++++++++++++++++++++++++++++++++++++++++++++++++++++++++ \n`,
  ];

  for (let request of pullRequests) {
    const approved = request.pr_review.find((rev) => rev.state == "APPROVED");
    const {
      labels,
      number,
      user: { login },
      created_at,
      html_url,
      requested_reviewers: reviewers,
      state: status,
      title,
    } = request;
    const reviewNames = reviewers.map(
      (rev) => `<@${githubUserToSlack[rev.login.toLowerCase()]}>`
    );
    const wipLabel = labels.find((lab) => lab.name == "WIP");
    const labelNames = labels.map((lab) => lab.name);
    const daysOpened = moment().diff(moment(created_at), "days");
    const message = [
      `${number} open by <@${
        githubUserToSlack[login.toLowerCase()]
      }> on ${moment(created_at).format("YYYY-MM-DD")}
      ${html_url}
        Title: ${title} 
          Label: ${labelNames.join(", ")}
      Reviewer: ${
           reviewNames.length == 1 ? reviewNames[0] : reviewNames.join(" ")
         }
      \n`,
    ];
    if (daysOpened > 5) {
      message.push(
        `   :turtle: :turtle: :turtle: OPENED MORE THAN ${daysOpened} DAYS AGO *************************** :hourglass:️ \n`
      );
    }
    if (wipLabel) {
      message.push(
        "   :radioactive_sign: WIP IGNORE ******************************************* :no_entry: \n"
      );
    }
    if (approved) {
      const {
        user: { login },
      } = approved;
      message.push(
        `:man_dancing: APPROVED BY <@${
          githubUserToSlack[login.toLowerCase()]
        }> - CONSIDER MERGING ************* :trophy: \n`
      );
    }

    formedString.push(message.join(""));
  }
  // send to slack
  sendMessageToChannel(channel ? channel : githubUserToSlack["devscrum"], formedString.join(""));
};

// run every day of the week at 10:00 am
// 0 10 * * 1-5
 cron.schedule('0 9 * * 1-5', () => {
   console.log('Runing a job at 10:00am');
   process.nextTick(() => {
     sendOpenPullRequestToChannel()
   })
 }, {
   scheduled: true,
   timezone: process.env.TIME_ZONE
 });

 export default sendOpenPullRequestToChannel;
 