const { Octokit } = require("@octokit/rest");
const { client } = require("./redis.js");
const { log } = require("./log.js");
const { exec } = require('child_process');

const unregister_runner = async function () {
  const octokit = new Octokit({
    auth : process.env.GITHUB_TOKEN
  });
  try {
    let user = await octokit.request('GET /user');
    log.info("Authenticated as " + user.data.login + " 🚀")
    log.info("Getting unregistration token from cache...")
    await client.connect();
    var runner_cache_key = process.env.GITHUB_PROFILE_NAME.toUpperCase() +"_RUNNER:unreg_token";
    var token = await client.get(runner_cache_key);
    if (!token) {
      log.warn("Unregister token not found in redis cache")
      log.info("Getting unregistration token from Github API...")
      var res = await octokit.request('POST /orgs/{org}/actions/runners/remove-token', {
        org: process.env.GITHUB_PROFILE_NAME
      });
      log.info("Cache the unregister token to redis...")
      await client.set(runner_cache_key, res.data.token);
      var exp = new Date(res.data.expires_at);
      await client.expireAt(runner_cache_key, exp)
      token = res.data.token
      log.info("Cache the unregister token to redis success 🚀")
    }
    log.info("Token unregistration successful retrieved 🤣")
    log.info("Running unregistration runner 💋 💋 💋")
    var command = "./config.sh remove --token " + token
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

exports.run = unregister_runner