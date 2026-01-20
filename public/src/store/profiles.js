// 配置文件 API 管理
const API_BASE = ''; // 使用相对路径，因为前端和后端在同一域名

async function loadProfiles() {
    try {
        const response = await fetch(`${API_BASE}/store`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to load profiles:', e);
        return [];
    }
}

async function addProfile(alias, url) {
    try {
        const response = await fetch(`${API_BASE}/store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias, url })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to add profile:', e);
        return null;
    }
}

async function updateProfile(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/store/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to update profile:', e);
        return null;
    }
}

async function deleteProfile(id) {
    try {
        const response = await fetch(`${API_BASE}/store/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to delete profile:', e);
        return null;
    }
}

async function getProfile(id) {
    const profiles = await loadProfiles();
    return profiles.find(p => p.id === id);
}