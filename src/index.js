#!/usr/bin/env node
const register_runner = require('./lib/register_token')
const unregister_runner = require('./lib/unregister_token')

const { program } = require("commander");

program.version("0.0.2")

program
  .command('register')
  .description("Register Github runner")
  .action(() => {
    register_runner.run();
  });

program
  .command('unregister')
  .description("Unregister Github runner")
  .action(() => {
    unregister_runner.run();
  });

program.parse();
