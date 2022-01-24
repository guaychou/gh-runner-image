const { Octokit } = require("@octokit/rest");
const { client } = require("./redis.js");
const { exec } = require('child_process');
const os = require('os');
const { log } = require("./log.js");
const register_runner = async function()  {

  const octokit = new Octokit({
    auth : process.env.GITHUB_TOKEN
  });
  try {
    let user = await octokit.request('GET /user');
    log.info("Authenticated as " + user.data.login + " 🚀")
    log.info("Getting registration token from cache...")
    await client.connect();
    var runner_cache_key = process.env.GITHUB_PROFILE_NAME.toUpperCase() +"_RUNNER:reg_token";
    var token = await client.get(runner_cache_key);
    if (!token) {
      log.warn("Token not found in redis cache")
      log.info("Getting registration token from Github API...")
      var res = await octokit.request('POST /orgs/{org}/actions/runners/registration-token', {
        org: process.env.GITHUB_PROFILE_NAME
      });
      log.info("Cache the token to redis...")
      await client.set(runner_cache_key, res.data.token);
      var exp = new Date(res.data.expires_at);
      await client.expireAt(runner_cache_key, exp)
      token = res.data.token;
      log.info("Cache the token to redis success 🚀")
    }
    log.info("Token registration successful retrieved 🤣")
    log.info("Running registration runner 💋 💋 💋")
    var command = "./config.sh --url https://github.com/"+ process.env.GITHUB_PROFILE_NAME + " --name "+os.hostname()+" --token " +token+ " --runnergroup default --work " + process.env.RUNNER_WORKSPACE + " --labels "  + process.env.RUNNER_LABEL
    exec(command, (error, stdout ,stderr) => {
      if (error) {
        log.error(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        log.error(`stderr: ${stderr}`);
        return;
      }
      log.info(`stdout: ${stdout} 🚀🚀🚀`);
      })
  }
  catch(error) {
    log.error(error)
  }
  finally{
    client.disconnect()
  }
}
exports.run = register_runner