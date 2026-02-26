---
name: github-bot-token
description: Generate GitHub App access tokens for bot authentication and git operations. Use when needing to authenticate as a GitHub App bot to perform git operations (push, pull, clone), access GitHub API, or when user asks to get bot token, use robot credentials, or authenticate with GitHub App. Triggers include "获取机器人 token", "GitHub bot 认证", "用机器人推送代码", "generate app token".
---

# GitHub Bot Token

Generate temporary access tokens for GitHub App authentication to perform git operations and API calls.

## Overview

This skill provides a lightweight Node.js script that generates GitHub App access tokens without complex SDKs. It uses JWT signing to authenticate as a GitHub App and obtain installation access tokens valid for 1 hour.

## Quick Start

### Prerequisites

1. GitHub App credentials:
   - App ID (found in App settings → About)
   - Private key file (.pem, see "How to Get Private Key" below)
   - Installation ID (can be discovered using the script)

2. Node.js >= 18 (for native fetch API support)

### How to Get Private Key

1. **Access GitHub App settings**
   - Visit https://github.com/settings/apps
   - Or: GitHub avatar → Settings → Developer settings → GitHub Apps
   - Select your App

2. **Generate and download private key**
   - In App settings page, find "Private keys" section
   - Click "Generate a private key" button
   - A `.pem` file will be automatically downloaded (filename like `your-app-name.2024-01-01.private-key.pem`)

3. **Save the private key**
   ```bash
   # Move to project directory
   mv ~/Downloads/your-app-name.*.private-key.pem ./private-key.pem

   # Or specify the downloaded file path in .env
   GITHUB_PRIVATE_KEY_PATH=~/Downloads/your-app-name.2024-01-01.private-key.pem
   ```

**Important notes:**
- Private key can only be downloaded once; GitHub doesn't store it
- If lost, generate a new one (old one will be revoked)
- One App can have multiple private keys (max 10)
- Never commit private key files to git (already excluded in .gitignore)

### Installation

Install dependencies in the scripts directory:

```bash
cd scripts/
npm install
```

### Usage Workflow

**Step 1: Configure environment variables**

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```bash
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
GITHUB_INSTALLATION_ID=  # Leave empty for first run
```

Alternatively, set environment variables directly:

```bash
export GITHUB_APP_ID=123456
export GITHUB_PRIVATE_KEY_PATH=./private-key.pem
```

**Step 2: Find Installation ID (first run)**

If you don't know the Installation ID, leave it empty and run:

```bash
node scripts/get-bot-token.js
```

The script will list all installations:

```
🔍 发现以下安装 (Installation):
- 账号/组织: petercat-ai | ID: 56789012
- 账号/组织: your-org | ID: 12345678
```

**Step 3: Generate Token (second run)**

Update `GITHUB_INSTALLATION_ID` in `.env` with the ID from step 2, then run again:

```bash
node scripts/get-bot-token.js
```

Output:

```
✅ 成功获取 Token (有效期1小时):
---------------------------------------------------
ghs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
---------------------------------------------------
```

**Step 4: Use the token**

Use the generated token for git operations:

```bash
# Method A: Embed in URL
git push https://x-access-token:TOKEN@github.com/org/repo.git

# Method B: Interactive input
git push
# Username: x-access-token
# Password: [paste token]

# Method C: Set as credential helper
git config credential.helper store
git push  # Enter x-access-token as username, token as password
```

## Token Permissions

The token's permissions are determined by your GitHub App configuration:

- **Repository permissions** → **Contents**: Must be "Read and write" for push operations
- **Repository permissions** → **Pull requests**: Required for PR operations
- **Repository permissions** → **Issues**: Required for issue operations

Check App settings → Permissions if operations fail with permission errors.

## Token Validity

- Access tokens expire after 1 hour
- Generate a new token when needed
- JWT tokens (used internally) expire after 10 minutes

## Troubleshooting

**"找不到私钥文件" error:**
- Verify the .pem file path in `GITHUB_PRIVATE_KEY_PATH` environment variable
- Use absolute path if relative path doesn't work
- Ensure the private key file has been downloaded from GitHub App settings

**"未设置 GitHub App ID" error:**
- Set `GITHUB_APP_ID` in `.env` file or as environment variable
- Find your App ID in GitHub App settings → About section

**"请求失败: 401" error:**
- Check APP_ID is correct
- Verify private key matches the App
- Ensure JWT hasn't expired (script handles this automatically)

**"请求失败: 404" error:**
- Verify INSTALLATION_ID is correct
- Check the App is installed on the target organization/repository

**Push fails with permission error:**
- Verify App has "Contents: Read and write" permission
- Check the App is installed on the target repository
- Ensure the installation hasn't been suspended

## Script Details

The script performs these operations:

1. Reads the private key from the .pem file
2. Generates a JWT token signed with RS256 algorithm
3. Uses JWT to authenticate with GitHub API
4. Either lists installations or generates an access token
5. Returns a token prefixed with `ghs_` for git operations

The script uses direct API calls instead of SDKs for transparency and minimal dependencies.
