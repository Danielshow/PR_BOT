import { githubUserToSlack } from "../utils/constants";
import {
  savePullRequest,
  checkIfPullRequestExist,
  updatePullRequest,
  deletePullRequest,
} from "./database";
import { sendDirectMessage } from "./slack";
import moment from 'moment';

const sendMessageToReviewer = (login, url, author) => {
  const requester = githubUserToSlack[login];
  const pr_author = githubUserToSlack[author];
  const attachments = [
    {
      text: url,
    },
  ];

  sendDirectMessage(
    requester,
    `Holla!!! Your review has been requested on <@${pr_author}> PR.`,
    attachments
  );
};

export default (app) => {
  app.post("/github", async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    console.log(payload);
    if (payload.action == "review_requested") {
      const pull_request = payload.pull_request;
      const reviewer = payload.requested_reviewer;
      const { login } = reviewer;
      sendMessageToReviewer(
        login,
        pull_request.html_url,
        pull_request.user.login
      );
    }
    const pullRequest = payload.pull_request;
    const {
      id: pull_id,
      html_url: pull_request_url,
      user: { login },
      closed_at,
      merged_at,
      requested_reviewers,
      labels: allLabels,
      draft,
      state: status,
      number: pull_num,
    } = pullRequest;

    if (draft) return;
    const wipLabel = allLabels.find((lab) => lab.name == "WIP");
    if (wipLabel) return;
    const labels = allLabels.map((lab) => lab.name);
    const reviewers = requested_reviewers.map(
      (review) => githubUserToSlack[review.login.toLowerCase()]
    );
    const user_id = githubUserToSlack[login.toLowerCase()];
    const is_exist = await checkIfPullRequestExist(pull_id);

    // if it is merged or closed, delete the key
    if ((merged_at || closed_at) && is_exist) {
      deletePullRequest(is_exist);
      return;
    } else if (merged_at || closed_at) return;
    let approved_by = "";
    let approval_status = "";
    let is_approved = false;
    let approved_at = null;
    let last_review_time = null
    if (payload.review) {
      const {
        user: { login },
        state,
      } = payload.review;
      if (state == "approved")
        approved_by = githubUserToSlack[login.toLowerCase()];
        approved_at = moment().valueOf()
      approval_status = state;
      is_approved = state && state.toLowerCase() == "approved";
      last_review_time = moment().valueOf();
      // sendMessageToUserAndOwnerOfPR
      const prOwner = pullRequest.user.login;
      const reviewer = payload.review.user.login;
      const attachments = [
        {
          text: pull_request_url,
        },
      ];
      sendDirectMessage(
        githubUserToSlack[prOwner.toLowerCase()],
        `:man_dancing: Hurray!!!! You PR has been approved by <@${
          githubUserToSlack[reviewer.toLowerCase()]
        }>`,
        attachments
      );
      sendDirectMessage(
        githubUserToSlack[reviewer.toLowerCase()],
        `:pray: Thanks for the review on ${html_url}`
      );
    }
    // update or save pull_request
    if (is_exist) {
      updatePullRequest({
        key: is_exist,
        user_id,
        pull_request_url,
        pull_id,
        status,
        labels,
        reviewers,
        pull_num,
        approval_status,
        approved_by,
        is_approved,
        approved_at
      });
    } else {
      savePullRequest({
        user_id,
        pull_request_url,
        pull_id,
        status,
        labels,
        reviewers,
        pull_num,
        approval_status,
        approved_by,
        is_approved,
        approved_at
      });
    }
  });
};
