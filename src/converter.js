// 订阅转换工具 - 将各种代理链接转换为 Clash 配置格式
function parseVlessLink(link, name) {
    try {
        const urlPart = link.replace('vless://', '');
        const [uuidHost, queryHash] = urlPart.split('?');
        const [uuid, hostPort] = uuidHost.split('@');
        const [host, port] = hostPort.split(':');
        const [query, hash] = queryHash ? queryHash.split('#') : ['', ''];
        const params = new URLSearchParams(query);

        return {
            name: name,
            server: host,
            port: parseInt(port) || 443,
            type: 'vless',
            uuid: uuid,
            tls: true,
            flow: params.get('flow') || '',
            network: params.get('type') || 'tcp',
            'reality-opts': params.get('security') === 'reality' ? {
                'public-key': params.get('pbk'),
                'short-id': params.get('sid') || ''
            } : undefined,
            'client-fingerprint': params.get('fp') || 'chrome',
            servername: params.get('sni') || host
        };
    } catch (e) {
        console.error('Failed to parse vless link:', e);
        return null;
    }
}

function parseVmessLink(link, name) {
    try {
        const base64 = link.replace('vmess://', '');
        const jsonStr = atob(base64);
        const config = JSON.parse(jsonStr);
        return {
            name: name,
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

function parseProxyLink(link, name) {
    const trimmed = link.trim();
    if (trimmed.startsWith('vless://')) {
        return parseVlessLink(trimmed, name);
    } else if (trimmed.startsWith('vmess://')) {
        return parseVmessLink(trimmed, name);
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