import { githubUserToSlack } from '../utils/constants';
import { sendDirectMessage } from './slack';

const sendMessageToReviewer = (login, url, author) => {
  const requester = githubUserToSlack(login);
  const pr_author = githubUserToSlack(author);
  sendDirectMessage(
    requester,
    `Holla!!! Your review has been requested on <@${pr_author}> PR. ${url}`
  );
};

export default (app) => {
  app.post('/github', async (req, res) => {
    const payload = JSON.parse(req.body.payload);
    if (payload.action == 'review_requested') {
      const pull_request = payload.pull_request;
      const reviewer = payload.requested_reviewer;
      const { login } = reviewer;
      sendMessageToReviewer(
        login,
        pull_request.html_url,
        pull_request.user.login
      );
      return;
    }
    const pullRequest = payload.pull_request;
    const {
      html_url: pull_request_url,
      closed_at,
      merged_at,
      labels: allLabels,
      draft
    } = pullRequest;

    if (draft) return;
    const wipLabel = allLabels.find((lab) => lab.name == 'WIP');
    if (wipLabel) return;
    // if it is merged or closed, delete the key
    if (merged_at || closed_at) return;
    if (payload.review) {
      const { state } = payload.review;
      is_approved = state && state.toLowerCase() == 'approved';
      if (is_approved) {
        // sendMessageToUserAndOwnerOfPR
        const prOwner = pullRequest.user.login;
        const reviewer = payload.review.user.login;
        sendDirectMessage(
          githubUserToSlack(prOwner.toLowerCase()),
          `:man_dancing: Hurray!!!! You PR has been approved by <@${
            githubUserToSlack(reviewer.toLowerCase())
          }> ${pull_request_url}`
        );
        sendDirectMessage(
          githubUserToSlack(reviewer.toLowerCase()),
          `:pray: Thanks for the review on ${pull_request_url}`
        );
      }
    }
  });
};
