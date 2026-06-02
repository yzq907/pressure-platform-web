<template>
  <aside class="app-sidebar">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-logo">
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#60A5FA"/>
              <stop offset="1" stop-color="#3B82F6"/>
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="11" :fill="`url(#${gradientId})`" opacity="0.16"/>
          <path d="M14 34V20l10-6 10 6v14l-10 6-10-6z" :stroke="`url(#${gradientId})`" stroke-width="2" fill="none"/>
          <path d="M24 26v8M20 28h8" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="24" cy="18" r="2.4" fill="#60A5FA"/>
        </svg>
      </div>
      <div class="brand-info">
        <span class="brand-name">分布式压测平台</span>
        <span class="brand-ver">v3.0 · CONTROL</span>
      </div>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-section-label">MANAGE</span>
        <router-link
          v-for="item in manageItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
          v-permiss="item.permiss"
        >
          <el-icon :size="18" class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <span class="nav-section-label">EXECUTE</span>
        <router-link
          v-for="item in executeItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
          v-permiss="item.permiss"
        >
          <el-icon :size="18" class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <span class="nav-section-label">SYSTEM</span>
        <router-link
          v-for="item in systemItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
          v-permiss="item.permiss"
        >
          <el-icon :size="18" class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Footer status -->
    <div class="sidebar-footer">
      <div class="footer-stat">
        <span class="stat-label">CPU</span>
        <div class="stat-bar"><span :style="{ width: cpuLoad + '%' }"></span></div>
        <span class="stat-val">{{ cpuLoad }}%</span>
      </div>
      <div class="footer-stat">
        <span class="stat-label">MEM</span>
        <div class="stat-bar"><span :style="{ width: memLoad + '%' }"></span></div>
        <span class="stat-val">{{ memLoad }}%</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Odometer, MagicStick, DocumentCopy, Calendar, Setting, List, TrendCharts, Monitor, Tickets, UserFilled, Clock, Key } from '@element-plus/icons-vue';

const gradientId = 'sidebar-brand-gradient';

const manageItems = [
  { icon: Odometer, path: '/testcase', label: '用例管理', permiss: 'testcase' },
  { icon: MagicStick, path: '/case-generation', label: '用例生成', permiss: 'case-generation' },
  { icon: DocumentCopy, path: '/jmx', label: '脚本管理', permiss: 'jmx' },
  { icon: Calendar, path: '/csv', label: '数据管理', permiss: 'csv' },
  { icon: Setting, path: '/jar', label: '依赖管理', permiss: 'jar' },
];

const executeItems = [
  { icon: List, path: '/execution', label: '执行队列', permiss: 'execution' },
  { icon: TrendCharts, path: '/report', label: '执行结果', permiss: 'report' },
];

const systemItems = [
  { icon: Monitor, path: '/node', label: '节点管理', permiss: 'node' },
  { icon: Tickets, path: '/config', label: '配置管理', permiss: 'config' },
  { icon: UserFilled, path: '/user', label: '用户管理', permiss: 'user' },
  { icon: Key, path: '/role', label: '角色管理', permiss: 'role' },
  { icon: Clock, path: '/audit', label: '审计日志', permiss: 'audit' },
];

const route = useRoute();
const isActive = (path: string) => route.path === path;

// 模拟实时 CPU / MEM 数据（节点管理后端尚未提供聚合接口时，先用平滑随机数）
const cpuLoad = ref(34);
const memLoad = ref(58);
let timer: ReturnType<typeof setInterval> | null = null;
const tick = () => {
  cpuLoad.value = Math.max(8, Math.min(92, cpuLoad.value + Math.round((Math.random() - 0.5) * 14)));
  memLoad.value = Math.max(20, Math.min(95, memLoad.value + Math.round((Math.random() - 0.5) * 6)));
};
onMounted(() => { timer = setInterval(tick, 4000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.app-sidebar {
  grid-area: sidebar;
  background:
    radial-gradient(ellipse 200% 100% at 0% 0%, rgba(96, 165, 250, 0.06), transparent 50%),
    var(--gradient-sidebar);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: var(--z-sidebar);
  position: relative;
}
.app-sidebar::after {
  content: '';
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(96, 165, 250, 0.16), transparent);
  pointer-events: none;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
  flex-shrink: 0;
}
.brand-logo {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.06);
  border: 1px solid rgba(96, 165, 250, 0.16);
  border-radius: 10px;
  flex-shrink: 0;
}
.brand-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
.brand-name {
  font-size: 14px;
  font-weight: 600;
  color: #F1F5F9;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
.brand-ver {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.12em;
  margin-top: 2px;
  text-transform: uppercase;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 4px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}
.nav-section:first-child {
  border-top: none;
}
.nav-section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: rgba(203, 213, 225, 0.32);
  letter-spacing: 0.16em;
  padding: 4px 12px 6px;
  text-transform: uppercase;
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-sidebar-fg);
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--color-sidebar-hover);
  color: #F1F5F9;
}
.nav-icon {
  color: rgba(203, 213, 225, 0.6);
  transition: color var(--transition-fast);
  flex-shrink: 0;
}
.nav-item:hover .nav-icon {
  color: #F1F5F9;
}
.nav-item.active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.04));
  color: #FFFFFF;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 8px; bottom: 8px;
  width: 3px;
  background: linear-gradient(180deg, #60A5FA, #3B82F6);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 12px #3B82F6;
}
.nav-item.active .nav-icon {
  color: #93C5FD;
}
.nav-label {
  overflow: hidden;
  flex: 1;
}

/* Footer */
.sidebar-footer {
  padding: 12px 16px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.footer-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
}
.stat-label {
  width: 32px;
  color: rgba(203, 213, 225, 0.4);
  letter-spacing: 0.08em;
  font-weight: 600;
}
.stat-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}
.stat-bar > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #60A5FA, #3B82F6);
  border-radius: 2px;
  transition: width 800ms cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-val {
  color: #93C5FD;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  width: 32px;
  text-align: right;
}

/* Collapsed */
.content-collapse .app-sidebar {
  width: var(--sidebar-collapsed);
}
.content-collapse .brand-info,
.content-collapse .nav-section-label,
.content-collapse .sidebar-footer {
  display: none;
}
.content-collapse .sidebar-brand {
  justify-content: center;
  padding: 20px 0 16px;
}
.content-collapse .nav-item {
  justify-content: center;
  padding: 10px;
}
.content-collapse .nav-label {
  display: none;
}
.content-collapse .nav-section {
  padding: 6px 0;
}

/* Scrollbar */
.app-sidebar::-webkit-scrollbar { width: 3px; }
.app-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 2px;
}
</style>
