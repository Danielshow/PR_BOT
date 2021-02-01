import cron from "node-cron";
import moment from "moment";
import { Octokit } from "@octokit/core";
import { githubUserToSlack } from "../utils/constants";
import { sendMessageToChannel } from "./slack";

const octokit = new Octokit({ auth: process.env.GITJIRA_GIT_ACCESS_TOKEN });
// Get all Reviews for a PR
export const getAllReviews = async (number) => {
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
      {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO,
        pull_number: number,
      }
    );
    return data;
  } catch (err) {
    console.log(err)
  }
};

export const getPullRequestById = async (id) => {
  try {
    let { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner: process.env.REPO_OWNER,
        repo: process.env.REPO,
        pull_number: id
      }
    );
  
    if (data && !data.merged_at && !data.closed_at) {
      const review = await getAllReviews(pr.number);
      data.pr_review = review;
    }
    return data;
  } catch (err) {
    console.log(err)
  }
}

// Get all Pull request
export const getAllPullRequest = async (date = null) => {
  try {
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
  } catch (err) {
    console.log(err);
  }
};

const sendOpenPullRequestToChannel = async (channel = null) => {
  try {
    const pullRequests = await getAllPullRequest(moment().subtract(30, "days")) || [];
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
            ${labelNames.length ? "Label: " + labelNames.join(", ") : ""}
        Reviewer: ${
             reviewNames.length ? reviewNames.join(" ") : "No reviewer Assigned"
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
        continue;
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
  } catch (err){
    console.log(err);
  }
};

export const nudgeReviewers = async (user_id, id) => {
  try {
    const pr = await getPullRequestById(id) || {};
    const {
      user: { login },
      pull_request_url,
      requested_reviewers,
    } = pr;
    const reviewerNames = requested_reviewers.map((rev) => rev.login);
    const attachments = [
      {
        text: pull_request_url,
      },
    ];
    if (!reviewerNames.length) {
      sendDirectMessage(
        githubUserToSlack[login.toLowerCase()],
        `:pray: Holla!!! <@${
          githubUserToSlack[login.toLowerCase()]
        }>, Please assign a reviewer to your pull request.`,
        attachments
      );
  
      sendDirectMessage(
        githubUserToSlack[user_id.toLowerCase()],
        `No reviewer has been assigned to the PR, I have nudged the author instead.`,
        attachments
      );
    } else {
      reviewerNames.map((name) => {
        sendDirectMessage(
          githubUserToSlack[name.toLowerCase()],
          `:computer: Holla!!!, <@${
            githubUserToSlack[user_id.toLowerCase()]
          }> just nudged you to review <@${githubUserToSlack[login.toLowerCase()]}> PR. Thanks.`,
          attachments
        );
      });
    }
  } catch (err){
    console.log(err)
  }
}

// run every day of the week at 10:00 am
// 0 10 * * 1-5
 cron.schedule('0 10 * * 1-5', () => {
   console.log('Runing a job at 10:00am');
   process.nextTick(() => {
     sendOpenPullRequestToChannel()
   })
 }, {
   scheduled: true,
   timezone: process.env.TIME_ZONE
 });

 export default sendOpenPullRequestToChannel;
 