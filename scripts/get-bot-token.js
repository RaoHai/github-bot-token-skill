const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

// 尝试加载 .env 文件（如果存在）
try {
    require('dotenv').config();
} catch (e) {
    // dotenv 不是必需的，如果没安装就跳过
}

// ================= 配置区域 =================
// 优先从环境变量读取，如果没有则使用默认值

// 1. GitHub App ID
// 环境变量: GITHUB_APP_ID
const APP_ID = process.env.GITHUB_APP_ID || '';

// 2. 私钥文件路径
// 环境变量: GITHUB_PRIVATE_KEY_PATH
// 默认查找当前目录下的 .pem 文件
const PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH || './private-key.pem';

// 3. Installation ID（可选）
// 环境变量: GITHUB_INSTALLATION_ID
const INSTALLATION_ID = process.env.GITHUB_INSTALLATION_ID || '';

// ===========================================

async function main() {
    try {
        // 验证必需的配置
        if (!APP_ID) {
            console.error('❌ 错误: 未设置 GitHub App ID');
            console.error('请设置环境变量 GITHUB_APP_ID 或在 .env 文件中配置');
            process.exit(1);
        }

        // 1. 读取私钥
        if (!fs.existsSync(PRIVATE_KEY_PATH)) {
            console.error(`❌ 错误: 找不到私钥文件: ${PRIVATE_KEY_PATH}`);
            console.error('请设置环境变量 GITHUB_PRIVATE_KEY_PATH 或将私钥文件放在当前目录');
            process.exit(1);
        }
        const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

        // 2. 生成 JWT (JSON Web Token)
        // 这是 App 向 GitHub 证明 "我是这个 App" 的凭证
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iat: now - 60, // 减去60秒以防时间偏差
            exp: now + (10 * 60), // JWT 有效期 10 分钟
            iss: APP_ID
        };

        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        // 3. 如果没有填写 INSTALLATION_ID，则列出所有安装信息
        if (!INSTALLATION_ID) {
            console.log('ℹ️  未提供 Installation ID，正在获取该 App 的安装列表...');
            await listInstallations(token);
            return;
        }

        // 4. 如果有 ID，则获取 Access Token
        await getAccessToken(token, INSTALLATION_ID);

    } catch (error) {
        console.error('❌ 发生错误:', error.message);
    }
}

// 获取 Access Token 的函数
async function getAccessToken(jwtToken, installId) {
    const url = `https://api.github.com/app/installations/${installId}/access_tokens`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Node-Script'
        }
    });

    if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('\n✅ 成功获取 Token (有效期1小时):');
    console.log('---------------------------------------------------');
    console.log(data.token);
    console.log('---------------------------------------------------');
    console.log('\n👉 使用命令进行 Push:');
    console.log(`git push https://x-access-token:${data.token}@github.com/your-org/your-repo.git`);
}

// 列出安装信息的函数
async function listInstallations(jwtToken) {
    const response = await fetch('https://api.github.com/app/installations', {
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Node-Script'
        }
    });

    const data = await response.json();

    if (!Array.isArray(data)) {
        console.error('获取列表失败', data);
        return;
    }

    console.log('\n🔍 发现以下安装 (Installation):');
    data.forEach(inst => {
        console.log(`- 账号/组织: ${inst.account.login} | ID: ${inst.id}`);
    });
    console.log('\n请将上面的 ID 设置到环境变量 GITHUB_INSTALLATION_ID 或 .env 文件中再运行一次。');
}

main();
