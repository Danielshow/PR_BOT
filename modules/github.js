import { githubUserToSlack } from '../utils/constants';
import { savePullRequest, checkIfPullRequestExist, updatePullRequest, deletePullRequest } from './database';

export default (app) => {
  app.post('/github', async (req, res) => {
    const payload = JSON.parse(req.body.payload);
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
      state: status
    } = pullRequest;

    if (draft) return;
    const wipLabel = allLabels.find(lab => lab.name == 'WIP');
    if (wipLabel) return
    const labels = allLabels.map(lab => lab.name);
    const reviewers = requested_reviewers.map(review => githubUserToSlack[review.login.toLowerCase()]);
    const user_id = githubUserToSlack[login.toLowerCase()]; 
    const is_exist = await checkIfPullRequestExist(pull_id);

    // if it is merged or closed, delete the key
    if ((merged_at || closed_at) && is_exist) {
      deletePullRequest(is_exist)
      return
    } else if (merged_at || closed_at) return;
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
        merged_at,
        closed_at
      }) 
    } else {
      savePullRequest({
        user_id,
        pull_request_url,
        pull_id,
        status,
        labels,
        reviewers,
        merged_at,
        closed_at
      });
    }
    console.log('labels', labels);
    console.log('requested_reviewers', reviewers);

  })
}

