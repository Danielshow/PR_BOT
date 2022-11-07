# PR_BOT
Slack PR Bot

### Functionality

- Send PR list to a channel
- Send message to reviewers when their review is requested
- Send message to author when PR is approved
- Remind authors to merge their pull_request
- Remind authors about WIP Prs
- Remind users everyday on their PR reviews
- Add a slash command for unsubscribing
- Remind author on their open PR's

### How to use Slash command
```
/list -> Post Pull request to the channel
/nudge prID RepositoryName -> Nudge Reviewer of a particular Pull request
```
### Todo
- Add a slash command for giving feedback

### How to setup
- Copy sample_env to env
- Add RepoList which is a comma seperated string of repository
- Add a github username to slack user id which is in this format
```
danielshow,36383737337:dshow,6278282722:
```
- yarn install
- yarn start
