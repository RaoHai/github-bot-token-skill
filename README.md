# GitHub Bot Token Skill

Generate temporary access tokens for GitHub App authentication. Perfect for AI agents that need to perform git operations (push, pull, clone) as a bot identity.

## Features

- Generate installation access tokens from GitHub App credentials
- Tokens expire in 1 hour (GitHub's limit)
- Works with any GitHub App you own

## Setup

1. Create a GitHub App at https://github.com/settings/apps
2. Generate a private key and download it
3. Install the App to your account/org
4. Copy `.env.example` to `.env` and fill in:
   - `GITHUB_APP_ID` - Your App's ID
   - `GITHUB_PRIVATE_KEY_PATH` - Path to your private key `.pem` file

## Usage

```bash
cd scripts
npm install
node get-bot-token.js
```

The script outputs a token you can use for git operations:

```bash
git push https://x-access-token:TOKEN@github.com/owner/repo.git main
```

## As a Nanobot Skill

This skill is designed for [nanobot](https://github.com/clusterfudge/nanobot) agents. Place the folder in your `workspace/skills/` directory and the agent can generate tokens on demand.

## License

MIT
