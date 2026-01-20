import { parseProxyLink } from './converter.js';

// 简单的 YAML 字符串化
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

export async function handleSubscribe(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    let configs = [];

    if (id) {
      // 单个配置
      const configStr = await env.PROXY_STORE.get(id);
      if (!configStr) {
        return new Response('Subscription not found', { status: 404 });
      }
      configs = [JSON.parse(configStr)];
    } else {
      // 批量导出所有启用的配置
      const keys = await env.PROXY_STORE.list();
      for (const key of keys.keys) {
        const configStr = await env.PROXY_STORE.get(key.name);
        if (configStr) {
          const config = JSON.parse(configStr);
          if (config.enabled) {
            configs.push(config);
          }
        }
      }
    }

    if (configs.length === 0) {
      return new Response('No enabled subscriptions found', { status: 404 });
    }

    // 收集所有代理
    const allProxies = [];

    for (const config of configs) {
      try {
        const proxyConfig = parseProxyLink(config.url, config.alias);
        if (proxyConfig) {
          allProxies.push(proxyConfig);
        }
      } catch (e) {
        console.error(`Error processing config ${config.alias}:`, e);
      }
    }

    if (allProxies.length === 0) {
      return new Response('No valid proxies found', { status: 404 });
    }

    // 生成合并的 Clash 配置
    const clashConfig = {
      port: 7890,
      'socks-port': 7891,
      'allow-lan': true,
      mode: 'Rule',
      'log-level': 'info',
      'external-controller': ':9090',
      proxies: allProxies,
      'proxy-groups': [
        {
          name: 'Proxy',
          type: 'select',
          proxies: allProxies.map(p => p.name)
        }
      ],
      rules: [
        'MATCH,Proxy'
      ]
    };

    return new Response(YAML.stringify(clashConfig), {
      headers: {
        'Content-Type': 'text/yaml',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}