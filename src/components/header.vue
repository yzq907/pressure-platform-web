<template>
  <header class="app-header">
    <div class="header-left">
      <button class="icon-btn" @click="collapseChage" :title="sidebar.collapse ? '展开菜单' : '收起菜单'" aria-label="切换侧边栏">
        <el-icon :size="18"><Fold v-if="!sidebar.collapse" /><Expand v-else /></el-icon>
      </button>
      <div class="breadcrumb">
        <span class="bc-item">管理中心</span>
        <el-icon :size="12" class="bc-sep"><ArrowRight /></el-icon>
        <span class="bc-item active">{{ currentTitle }}</span>
      </div>
    </div>

    <div class="header-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-chip">
          <div class="avatar">{{ avatarLetter }}</div>
          <div class="u-info">
            <span class="u-name">{{ username }}</span>
            <span class="u-role">{{ userRole }}</span>
          </div>
          <el-icon :size="12" class="u-caret"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="user">
              <el-icon><UserFilled /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="loginout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSidebarStore } from '../store/sidebar';
import { useRouter, useRoute } from 'vue-router';
import { Fold, Expand, ArrowDown, ArrowRight, UserFilled, SwitchButton } from '@element-plus/icons-vue';

const username: string = localStorage.getItem('ms_username') || 'guest';
const sidebar = useSidebarStore();
const route = useRoute();

const avatarLetter = computed(() => username.charAt(0).toUpperCase());
const userRole = computed(() => username === 'admin' ? '系统管理员' : '普通用户');
const currentTitle = computed(() => (route.meta?.title as string) || '');

const collapseChage = () => {
  sidebar.handleCollapse();
};

onMounted(() => {
  if (document.body.clientWidth < 1500) {
    collapseChage();
  }
});

const router = useRouter();
const handleCommand = (command: string) => {
  if (command == 'loginout') {
    localStorage.removeItem('ms_username');
    localStorage.removeItem('token');
    router.push('/login');
  } else if (command == 'user') {
    router.push('/profile');
  }
};
</script>

<style scoped>
.app-header {
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  background: var(--color-header-bg);
  backdrop-filter: blur(16px) saturate(1.6);
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  border-bottom: 1px solid var(--color-header-border);
  z-index: var(--z-header);
  height: var(--header-height);
  position: relative;
}
.app-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0; right: 0;
  height: 1px;
  background: var(--gradient-line);
  opacity: 0.4;
  pointer-events: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* icon button */
.icon-btn {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-fg-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  text-decoration: none;
}
.icon-btn:hover {
  background: var(--color-bg-muted);
  color: var(--color-fg);
  border-color: var(--color-border);
}

/* breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-fg-tertiary);
}
.bc-sep { color: var(--color-fg-tertiary); }
.bc-item.active {
  color: var(--color-fg);
  font-weight: 600;
}

/* user chip */
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.user-chip:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-brand-400);
}
.avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.u-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.u-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-fg);
}
.u-role {
  font-size: 10.5px;
  color: var(--color-fg-tertiary);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}
.u-caret {
  color: var(--color-fg-tertiary);
  margin-left: 2px;
}
</style>
