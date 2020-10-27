import cron from 'node-cron';
import moment from 'moment';
import { getAllPullRequest } from './database';

const sendOpenPullRequestToChannel = async () => {
  // get pull request from firebase
  const pullRequests = await getAllPullRequest();
  const formedString =[
    `++++++++++++++++++++++++++++++++++++++++++++++++++++++++
     Recent Open FLMTG Pull Requests
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++`];
  for (let key of Object.keys(pullRequests)) {
    // if it is wip skip
    const request = pullRequests[key];
    const { labels, pull_id, user_id, timestamp, pull_request_url, reviewers, pull_num, status, is_approved } = request;
    const reviewNames = reviewers.map(rev => `<@${rev}>`);
    const wipLabel = labels.find(lab => lab == 'WIP');
    if (wipLabel) return
    const daysOpened = moment().diff(timestamp, 'days');
    const message = [
      `${pull_num || 1} open by <@${user_id}> on ${moment(timestamp)}
           ${pull_request_url}
           Label: ${labels.join(',')}
             Reviewer: ${reviewNames.length == 1 ? reviewNames[0] : reviewNames.join(' ')}
      `
    ]

    if (daysOpened > 5) {
      message.push(`OPENED MORE THAN ${daysOpened} DAYS AGO *************************** :hourglass:️`);
    }
    if (status == 'approved' || is_approved) {
      const { approved_by } = request;
      message.push(`:man_dancing: APPROVED BY <@${approved_by}> - CONSIDER MERGING ************* :trophy:`)

    }

    formedString.push(message.join('\n'));
  }

  console.log(formedString);
  // format PR's based on days
  // send message to channel
}

export default sendOpenPullRequestToChannel;
