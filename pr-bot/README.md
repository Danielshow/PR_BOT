### PR-BOT
This is created using serverless.

### Prerequisites
Install serverless globally

```bash
npm i -g serverless
```
### Functionality

- Send PR list to a channel
- Remind authors/reviewers on status of their pull request

### Local invocation
In order to test out your functions locally, you can invoke them with the following command:

```
serverless invoke local --function cronHandler
```

After invocation, you should see output similar to:

```bash
Your cron function cronHandler ran at Fri Mar 05 2021 15:14:39 GMT+0100 (Central European Standard Time)
```
- Ast the team for the env needed for the app to run. create an .env file on the root before invoking locally.

### Deploy
- Make changes
- invoke locally to test
- Setup serverless to connect to aws using
```bash
sls config credentials --provider aws --key {AWS_KEY} --secret {AWS_SECRET} --profile {Profile if needed}
```
- sls deploy