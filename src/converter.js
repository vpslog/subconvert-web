// 订阅转换工具 - 将各种代理链接转换为 Clash 配置格式
function parseVlessLink(link) {
    try {
        const url = new URL(link);
        return {
            name: url.hash ? decodeURIComponent(url.hash.substring(1)) : url.hostname,
            server: url.hostname,
            port: parseInt(url.port) || 443,
            type: 'vless',
            uuid: url.username,
            tls: true,
            flow: url.searchParams.get('flow') || '',
            network: url.searchParams.get('type') || 'tcp',
            'reality-opts': url.searchParams.get('security') === 'reality' ? {
                'public-key': url.searchParams.get('pbk'),
                'short-id': url.searchParams.get('sid') || ''
            } : undefined,
            'client-fingerprint': url.searchParams.get('fp') || 'chrome',
            servername: url.searchParams.get('sni') || url.hostname
        };
    } catch (e) {
        console.error('Failed to parse vless link:', e);
        return null;
    }
}

function parseVmessLink(link) {
    try {
        const base64 = link.replace('vmess://', '');
        const jsonStr = atob(base64);
        const config = JSON.parse(jsonStr);
        return {
            name: config.ps || config.add,
            server: config.add,
            port: parseInt(config.port),
            type: 'vmess',
            uuid: config.id,
            alterId: parseInt(config.aid) || 0,
            cipher: config.scy || 'auto',
            tls: config.tls === 'tls',
            network: config.net || 'tcp',
            'ws-opts': config.net === 'ws' ? {
                path: config.path || '/',
                headers: { Host: config.host || config.add }
            } : undefined,
            udp: true
        };
    } catch (e) {
        console.error('Failed to parse vmess link:', e);
        return null;
    }
}

function parseProxyLink(link) {
    const trimmed = link.trim();
    if (trimmed.startsWith('vless://')) {
        return parseVlessLink(trimmed);
    } else if (trimmed.startsWith('vmess://')) {
        return parseVmessLink(trimmed);
    } else {
        return null;
    }
}

function convertSubscriptionToClash(subscriptionText) {
    try {
        // 解析订阅链接（base64 编码的链接列表）
        const decoded = atob(subscriptionText.trim());
        const links = decoded.split('\n').filter(link => link.trim());

        const proxies = [];
        const proxyNames = [];

        for (const link of links) {
            const proxyConfig = parseProxyLink(link);
            if (proxyConfig) {
                proxies.push(proxyConfig);
                proxyNames.push(proxyConfig.name);
            }
        }

        if (proxies.length === 0) {
            return null;
        }

        // 生成 Clash 配置
        const clashConfig = {
            port: 7890,
            'socks-port': 7891,
            'allow-lan': true,
            mode: 'Rule',
            'log-level': 'info',
            'external-controller': ':9090',
            proxies: proxies,
            'proxy-groups': [
                {
                    name: 'Proxy',
                    type: 'select',
                    proxies: proxyNames
                }
            ],
            rules: [
                'MATCH,Proxy'
            ]
        };

        return YAML.stringify(clashConfig);
    } catch (e) {
        console.error('Failed to convert subscription:', e);
        return null;
    }
}

// 简单的 YAML 字符串化（简化版）
const YAML = {
    stringify: function(obj, indent = 0) {
        let result = '';
        const spaces = ' '.repeat(indent);

        if (Array.isArray(obj)) {
            for (const item of obj) {
                result += spaces + '- ';
                if (typeof item === 'object') {
                    result += YAML.stringify(item, indent + 2).trim() + '\n';
                } else {
                    result += item + '\n';
                }
            }
        } else if (typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                result += spaces + key + ': ';
                if (typeof value === 'object') {
                    result += '\n' + YAML.stringify(value, indent + 2);
                } else {
                    result += value + '\n';
                }
            }
        } else {
            result += obj + '\n';
        }

        return result;
    }
};

export { convertSubscriptionToClash, parseProxyLink };