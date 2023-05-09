import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { Octokit } from '@octokit/core';
import { sendMessageToChannel } from './slack.js';

dotenv.config();
const { GIT_ACCESS_TOKEN, GITHUB_USER_TO_SLACK, REPO_OWNER, REPO_LIST } = process.env;
const octokit = new Octokit({ auth: GIT_ACCESS_TOKEN });

export function githubUserToSlack(user) {
  const users = GITHUB_USER_TO_SLACK;
  const userMap = {}

   users.split(':').forEach((user) => {
     const [github, slack] = user.split(',')
     userMap[github] = slack
   })

   return userMap[user]
}
// Get all Reviews for a PR
const getAllReviews = async (number, repo) => {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
      {
        owner: REPO_OWNER,
        repo: repo,
        pull_number: number
      }
    );
    return data;
  } catch (err) {
    console.log(err?.response?.data);
  }
};
// Get all Pull request
export const getAllPullRequest = async (date = null) => {
  const allData = [];
  try {
    const repoList = REPO_LIST.split(',');
    await Promise.all(
      repoList.map(async (repo) => {
        try {
          let { data } = await octokit.request(
            'GET /repos/{owner}/{repo}/pulls?sort=created&state=open&direction=desc',
            {
              owner: REPO_OWNER,
              repo: repo
            }
          );

          if (date) {
            data = data.filter((dt) => date.isBefore(dayjs(dt.created_at)));
          }
          await Promise.all(
            data.map(async (pr) => {
              const review = await getAllReviews(pr.number, repo);
              pr.pr_review = review;
            })
          );

          allData.push(...data);
        } catch (err) {
          console.log('Error: ', err.response.data, repo);
        }
      })
    );

    allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return allData;
  } catch (err) {
    console.log(err?.response?.data);
  }
};

const sendOpenPullRequestToChannel = async (channel = null) => {
  try {
    let pullRequests = (await getAllPullRequest()) || [];
    pullRequests = pullRequests.filter((dt) =>
      dayjs().subtract(120, 'days').isBefore(dayjs(dt.created_at))
    );
    const formedString = [
      `++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                      Recent Open Pull Requests (${pullRequests.length})              
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++ \n`
    ];

    for (let request of pullRequests) {
      const approved = request.pr_review.find((rev) => rev.state == 'APPROVED');
      const commentAndRequestChanges = request.pr_review.filter(
        (rev) => rev.state == 'COMMENTED' || rev.state == 'CHANGES_REQUESTED'
      );

      let reviewNames = request.pr_review.map(
        (r) => `<@${githubUserToSlack(r.user.login.toLowerCase())}>`
      );

      const {
        labels,
        number,
        user: { login },
        created_at,
        html_url,
        requested_reviewers: reviewers,
        state: status,
        title
      } = request;

      reviewNames.push(
        ...reviewers.map(
          (rev) => `<@${githubUserToSlack(rev.login.toLowerCase())}>`
        )
      );

      reviewNames = [...new Set(reviewNames)];
      const wipLabel = labels.find((lab) => lab.name == 'WIP');
      const holdLabel = labels.find((lab) => lab.name == 'HOLD');
      const labelNames = labels.map((lab) => lab.name);
      const daysOpened = dayjs().diff(dayjs(created_at), 'days');
      const message = [
        `${number} open by <@${
          githubUserToSlack(login.toLowerCase())
        }> on ${dayjs(created_at).format('YYYY-MM-DD')}
        ${html_url}
          Title: ${title} 
            ${labelNames.length ? 'Label: ' + labelNames.join(', ') : ''}
        Reviewer: ${
          reviewNames.length ? reviewNames.join(' ') : 'No reviewer Assigned'
        }
        \n`
      ];

      const MapName = {
        COMMENTED: 'Commented',
        CHANGES_REQUESTED: 'Requested changes'
      };
      if (commentAndRequestChanges.length) {
        commentAndRequestChanges.map(({ user: { login }, state, html_url }) => {
          message.push(
            `<@${githubUserToSlack(login.toLowerCase())}>:  ${
              MapName[state]
            } \n`
          );
        });
      }
      if (daysOpened > 5) {
        message.push(
          `   :turtle: :turtle: :turtle: OPENED MORE THAN ${daysOpened} DAYS AGO *************************** :hourglass:️ \n`
        );
      }
      if (wipLabel || holdLabel) {
        message.push(
          '   :radioactive_sign: WIP IGNORE ******************************************* :no_entry: \n'
        );
        continue;
      }
      if (approved) {
        const {
          user: { login }
        } = approved;
        message.push(
          `:man_dancing: APPROVED BY <@${
            githubUserToSlack(login.toLowerCase())
          }> - CONSIDER MERGING ************* :trophy: \n`
        );
      }

      formedString.push(message.join(''));
    }
    // send to slack
    sendMessageToChannel(
      channel ? channel : githubUserToSlack('devscrum'),
      formedString.join('')
    );
  } catch (err) {
    console.log("Semd open pull request to channel error: ", err.message);
  }
};

export default sendOpenPullRequestToChannel;
