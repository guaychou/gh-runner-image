const { Octokit } = require("@octokit/rest");
const { client } = require("./redis.js");
const chalk = require('chalk');
const { exec } = require('child_process');

const unregister_runner = async function () {
  const octokit = new Octokit({
    auth : process.env.GITHUB_TOKEN
  });
  try {
    let user = await octokit.request('GET /user');
    console.log(chalk.blue("Authenticated as ")+ chalk.green(user.data.login) + " 🚀")
    console.info(chalk.cyan("Getting unregistration token from cache..."))
    await client.connect();
    var runner_cache_key = process.env.GITHUB_PROFILE_NAME.toUpperCase() +"_RUNNER:unreg_token";
    var token = await client.get(runner_cache_key);
    
    if (!token) {
      console.info(chalk.red("Unregister token not found in redis cache"))
      console.info(chalk.cyan("Getting unregistration token from Github API..."))
      var res = await octokit.request('POST /orgs/{org}/actions/runners/remove-token', {
        org: process.env.GITHUB_PROFILE_NAME
      });
      console.info(chalk.cyan("Cache the unregister token to redis..."))
      await client.set(runner_cache_key, res.data.token);
      var exp = new Date(res.data.expires_at);
      await client.expireAt(runner_cache_key, exp)
      token = res.data.token
      console.info(chalk.green("Cache the unregister token to redis success 🚀"))
    }
    console.log(chalk.greenBright("Token unregistration successful retrieved 🤣"))
    console.log(chalk.cyan("Running unregistration runner 💋 💋 💋"))
    var command = "./config.sh remove --token " + token
    exec(command, (error, stdout ,stderr) => {
    if (error) {
      console.log(chalk.redBright(`error: ${error.message}`));
      return;
    }
    if (stderr) {
        console.log(chalk.red(`stderr: ${stderr}`));
        return;
    }
    console.log(chalk.greenBright(`stdout: ${stdout} 🚀🚀🚀`));
    })
  }
  catch(error) {
    console.log(error)
  }
  finally{
    client.disconnect()
  }
}

exports.run = unregister_runner