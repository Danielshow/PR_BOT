// Remind users everyday on their PR reviews
// Remind author on their open PR's
// If it has been open for more than 2 days

import { githubUserToSlack } from "../utils/constants";
import { sendDirectMessage } from "./slack";
import moment from "moment";
import { getAllPullRequest } from "./cronJob";
import cron from "node-cron";

const cronTime = process.env.CRON_TIME || 9;
const prReviews = async () => {
  try {
    // moment().subtract(30, "days")
    const pullRequests = await getAllPullRequest();
    const approvedPrs = [];
    const WIPPrs = [];
    const unReviewedPrs = [];
    // const approved = request.pr_review.find((rev) => rev.state == "APPROVED");
    for (let request of pullRequests) {
      const { labels, created_at } = request;
      const lastReview = request.pr_review[request.pr_review.length - 1];
      const wipLabel = labels.find((lab) => lab.name == "WIP");
      if (lastReview && lastReview.state == "APPROVED") {
        const approved = { ...lastReview, user_login: request.user.login };
        approvedPrs.push(approved);
      } else if (wipLabel && moment().diff(moment(created_at), "days") > 3) {
        WIPPrs.push(request);
      } else if (
        !lastReview &&
        !wipLabel &&
        moment().diff(moment(request.created_at)) > 3
      ) {
        unReviewedPrs.push(request);
      }
    }
  
    remindAuthorsToMergeApprovedPrs(approvedPrs);
    nudgeAuthorsAboutWipPrs(WIPPrs);
    nudgeReviewersToReviewPR(unReviewedPrs);
  } catch(err){
    console.log(err)
  }
};

const remindAuthorsToMergeApprovedPrs = async (approvedPrs) => {
  await Promise.all(
    approvedPrs.map(async (pr) => {
      const {
        user: { login },
        html_url: pull_request_url,
        user_login,
        submitted_at,
      } = pr;
      if (moment().diff(moment(submitted_at), "days") > 1) {
        await sendDirectMessage(
          githubUserToSlack(user_login.toLowerCase()),
          `:happygoat: Your PR has been approved by <@${
            githubUserToSlack(login.toLowerCase())
          }> for over a day. Please see to it!!!
           ${pull_request_url}
          `,
        );
      }
    })
  );
};

const nudgeAuthorsAboutWipPrs = async (WipPrs) => {
  await Promise.all(
    WipPrs.map(async (pr) => {
      const {
        user: { login },
        html_url: pull_request_url,
        created_at,
      } = pr;
      const date_opened = moment().diff(moment(created_at), "days");
      if (date_opened > 3) {
        await sendDirectMessage(
          githubUserToSlack(login.toLowerCase()),
          `:crying_cat_face: Your PR has been in WIP state for ${date_opened} days. Post on #dev-helpline or reach out if you need help.
            ${pull_request_url}
          `,
        );
      }
    })
  );
};

const nudgeReviewersToReviewPR = async (unReviewedPrs) => {
  await Promise.all(
    unReviewedPrs.map(async (pr) => {
      const {
        user: { login },
        html_url: pull_request_url,
        requested_reviewers,
        created_at,
      } = pr;
      const reviewerNames = requested_reviewers.map((rev) => rev.login);
      const date_opened = moment().diff(moment(created_at), "days");
      if (date_opened > 3 && reviewerNames.length) {
        reviewerNames.map((name) => {
          sendDirectMessage(
            githubUserToSlack(name.toLowerCase()),
            `:crying_cat_face: Holla!!!, <@${
              githubUserToSlack(login.toLowerCase())
            }> Pull Request has been opened for over ${date_opened} days now. Please help review. Thanks.
             ${pull_request_url}
            `,
          );
        });
      } else if (!reviewerNames.length) {
        sendDirectMessage(
          githubUserToSlack(login.toLowerCase()),
          `:pray: Holla!!! <@${
            githubUserToSlack(login.toLowerCase())
          }>, Please assign a reviewer to your pull request.
           ${pull_request_url}
          `,
        );
      }
    })
  );
};

// run every day of the week at 10:00 am
cron.schedule(`45 ${cronTime} * * 1-5`, () => {
  console.log('Runing a job at 10:00am');
  process.nextTick(async () => {
    console.log(`Running a job for ${cronTime} for PR reviews`);
    await prReviews()
  })
}, {
  scheduled: true,
  timezone: process.env.TIME_ZONE
});
