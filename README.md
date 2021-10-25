# Github Runner Image

## Stack
- Base image: Ubi8 minimal
- S6 overlay
- python 3.9
- nodejs
- unzip
- openssh-client
- tar
- gzip
- ansible
- git
- PyYaml
- DNSpython
- jmespath
- docker-py
- dotnet github action runtime

## Why use s6 overlay ?
We want to unregister whenever the runner goes down or stopped. With S6 overlay we have style for that, actually you can trap signal in your entrypoint, but there is no style with that. So in github web there is no trash offline runner


## Docker-compose example

```yaml
version: "3.9"
services:
  gh-runner:
    container_name: gh-runner
    restart: on-failure
    image: "<YOUR_IMAGE_TAG>"
    volumes:
      - /home/ansible/.ssh:/opt/ansible/.ssh
      - /home/ansible/.terraformrc:/opt/ansible/.terraformrc
    environment:
      - GITHUB_PROFILE_NAME=organization_name
      - GITHUB_TOKEN=<github_token>
      - RUNNER_LABEL=self-hosted,Linux
      - REDIS_URI=redis://redis:6379
  redis:
    container_name: redis
    image: redis
    restart: always
```

### Maintainer

```
- Kevin Jonathan Harnanta <crossmajor99@gmail.com>
```