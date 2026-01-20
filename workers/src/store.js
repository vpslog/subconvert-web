export async function handleStore(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/store/')[1];

    if (request.method === 'GET') {
      // 获取所有配置
      const keys = await env.PROXY_STORE.list();
      const configs = [];
      for (const key of keys.keys) {
        const value = await env.PROXY_STORE.get(key.name);
        if (value) {
          configs.push({ id: key.name, ...JSON.parse(value) });
        }
      }
      return new Response(JSON.stringify(configs), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else if (request.method === 'POST') {
      // 创建新配置
      const config = await request.json();
      if (!config.alias || !config.url) {
        return new Response(JSON.stringify({ error: 'Alias and URL are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const newId = Date.now().toString();
      const fullConfig = {
        ...config,
        id: newId,
        enabled: config.enabled || true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await env.PROXY_STORE.put(newId, JSON.stringify(fullConfig));
      return new Response(JSON.stringify(fullConfig), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else if (request.method === 'PUT') {
      // 更新配置
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const existing = await env.PROXY_STORE.get(id);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Config not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const updates = await request.json();
      const updatedConfig = { ...JSON.parse(existing), ...updates, updatedAt: Date.now() };
      await env.PROXY_STORE.put(id, JSON.stringify(updatedConfig));
      return new Response(JSON.stringify(updatedConfig), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else if (request.method === 'DELETE') {
      // 删除配置
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      await env.PROXY_STORE.delete(id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}