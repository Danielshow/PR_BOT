// Remind users everyday on their PR reviews
// Remind author on their open PR's
// If it has been open for more than 2 days

import { githubUserToSlack } from '../utils/constants';
import { sendDirectMessage } from './slack';
import moment from 'moment';
import {  } from './cronJob';

const prReviews = async () => {
  const pullRequests = await getAllPullRequest(moment().subtract(30, "days"));
  // const approved = request.pr_review.find((rev) => rev.state == "APPROVED");
  // Get approved PRs
  const approvedPrs = formattedPullRequest.filter(pull => pull.is_approved && moment().diff(moment(pull.approved_at), "days") > 1);
  // Get Open PRs
  const openedPrs = formattedPullRequest.filter(pull => !pull.is_approved && moment().diff(moment(pull.timestamp), "days") > 3);
  const unReviewedPrs = formattedPullRequest.filter(pull => {
    const { user_id, last_review_time, is_approved } = pull;
    if (is_approved) return false;
    if (!last_review_time &&  moment().diff(moment(pull.timestamp), "days") > 3) return true;
    if (last_review_time && moment().diff(moment(last_review_time), "days") > 2) return true;
    return false;
  })


  

}

const remindAuthorsOfOpenPrs = () => {

}

const remindUsersOfTheirPrReviews = (unReviewedPrs) => {
  await Promise.all(
    approvedPrs.map(async (pr) => {
      const { user_id, pull_request_url } = pr;
      const attachments = [
        {
          text: pull_request_url,
        },
      ];

      await sendDirectMessage(user_id, `:happygoat: Your PR has been approved for over a day. Please see to it!!!`, attachments);
    })
  )
}

const remindAuthorsToMergeApprovedPrs = (approvedPrs) => {
  await Promise.all(
    approvedPrs.map(async (pr) => {
      const { user_id, pull_request_url } = pr;
      const attachments = [
        {
          text: pull_request_url,
        },
      ];

      await sendDirectMessage(user_id, `:happygoat: Your PR has been approved for over a day. Please see to it!!!`, attachments);
    })
  );
}

