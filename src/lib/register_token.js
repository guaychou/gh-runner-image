const { Octokit } = require("@octokit/rest");
const { client } = require("./redis.js");
const { exec } = require('child_process');
const chalk = require('chalk');
const os = require('os');

const register_runner = async function()  {

  const octokit = new Octokit({
    auth : process.env.GITHUB_TOKEN
  });
  try {
    let user = await octokit.request('GET /user');
    console.log(chalk.blue("Authenticated as ")+ chalk.green(user.data.login) + " 🚀")
    console.info(chalk.cyan("Getting registration token from cache..."))
    await client.connect();
    var runner_cache_key = process.env.GITHUB_PROFILE_NAME.toUpperCase() +"_RUNNER:reg_token";
    var token = await client.get(runner_cache_key);
    if (!token) {
      console.info(chalk.red("Token not found in redis cache"))
      console.info(chalk.cyan("Getting registration token from Github API..."))
      var res = await octokit.request('POST /orgs/{org}/actions/runners/registration-token', {
        org: process.env.GITHUB_PROFILE_NAME
      });
      console.info(chalk.cyan("Cache the token to redis..."))
      await client.set(runner_cache_key, res.data.token);
      var exp = new Date(res.data.expires_at);
      await client.expireAt(runner_cache_key, exp)
      token = res.data.token;
      console.info(chalk.green("Cache the token to redis success 🚀"))
    }
    console.log(chalk.greenBright("Token registration successful retrieved 🤣"))
    console.log(chalk.cyan("Running registration runner 💋 💋 💋"))
    var command = "./config.sh --url https://github.com/"+ process.env.GITHUB_PROFILE_NAME + " --name "+os.hostname()+" --token " +token+ " --runnergroup default --work " + process.env.RUNNER_WORKSPACE + " --labels "  + process.env.RUNNER_LABEL
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

exports.run = register_runner