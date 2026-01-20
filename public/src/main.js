const { createApp, ref, onMounted } = Vue;

// 引入模块
// 由于浏览器不支持import，这里用script标签引入，但为了简单，假设全局

const app = createApp({
    template: '#app-template',
    setup() {
        const newAlias = ref('');
        const newUrl = ref('');
        const profiles = ref([]);
        const editingId = ref(null);
        const loading = ref(false);

        // 全局配置
        const globalTarget = ref('clash');
        const globalConfig = ref('');


        // 移除解析功能，后端处理

        // 批量导出所有启用的订阅链接
        const exportAllLinks = () => {
            const link = `${window.location.origin}/subscribe`;
            navigator.clipboard.writeText(link).then(() => alert('批量订阅链接已复制到剪贴板'));
        };

        const loadData = async () => {
            loading.value = true;
            try {
                profiles.value = await loadProfiles();
            } catch (e) {
                console.error('Failed to load data:', e);
            } finally {
                loading.value = false;
            }
        };

        onMounted(loadData);

        const addOrUpdateProfile = async () => {
            if (!newAlias.value || !newUrl.value) return;

            loading.value = true;
            try {
                if (editingId.value) {
                    await updateProfile(editingId.value, { alias: newAlias.value, url: newUrl.value });
                    editingId.value = null;
                } else {
                    await addProfile(newAlias.value, newUrl.value);
                }
                newAlias.value = '';
                newUrl.value = '';
                await loadData();
            } catch (e) {
                console.error('Failed to save profile:', e);
                alert('保存失败');
            } finally {
                loading.value = false;
            }
        };

        const editProfile = async (id) => {
            loading.value = true;
            try {
                const profile = await getProfile(id);
                if (profile) {
                    newAlias.value = profile.alias;
                    newUrl.value = profile.url;
                    editingId.value = id;
                }
            } catch (e) {
                console.error('Failed to get profile:', e);
            } finally {
                loading.value = false;
            }
        };

        const toggleEnabled = async (id) => {
            const profile = profiles.value.find(p => p.id === id);
            if (profile) {
                loading.value = true;
                try {
                    await updateProfile(id, { enabled: !profile.enabled });
                    await loadData();
                } catch (e) {
                    console.error('Failed to toggle enabled:', e);
                    alert('操作失败');
                } finally {
                    loading.value = false;
                }
            }
        };

        const deleteProf = async (id) => {
            if (confirm('确认删除？')) {
                loading.value = true;
                try {
                    await deleteProfile(id);
                    await loadData();
                } catch (e) {
                    console.error('Failed to delete profile:', e);
                    alert('删除失败');
                } finally {
                    loading.value = false;
                }
            }
        };

        const exportLink = (profile) => {
            const link = `${window.location.origin}/subscribe?id=${profile.id}`;
            navigator.clipboard.writeText(link).then(() => alert('订阅链接已复制到剪贴板'));
        };

        return {
            newAlias,
            newUrl,
            profiles,
            loading,
            addOrUpdateProfile,
            editProfile,
            toggleEnabled,
            deleteProf,
            exportLink,
            editingId,
            globalTarget,
            globalConfig,
            exportAllLinks
        };
    }
});

app.mount('#app');