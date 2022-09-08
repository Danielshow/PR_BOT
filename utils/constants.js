export function githubUserToSlack(user) {
   const users = process.env.GITHUB_USER_TO_SLACK
   const userMap = {}

    users.split(':').forEach((user) => {
      const [github, slack] = user.split(',')
      userMap[github] = slack
    })

    return userMap[user]
}