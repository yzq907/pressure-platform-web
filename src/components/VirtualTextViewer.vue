<template>
  <div ref="containerRef" class="virtual-text-container" @scroll="onScroll">
    <div class="virtual-text-spacer" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-text-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div
        v-for="(line, index) in visibleLines"
        :key="startIndex + index"
        class="virtual-text-line"
        :style="{ height: lineHeight + 'px' }"
      >
        {{ line || ' ' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  content: string;
  lineHeight?: number;
}>();

const lineHeight = props.lineHeight || 20;
const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);
const containerHeight = ref(0);
const bufferSize = 10;
let resizeObserver: ResizeObserver | null = null;

const lines = computed(() => {
  if (!props.content) return [];
  return props.content.split('\n');
});

const totalHeight = computed(() => lines.value.length * lineHeight);

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / lineHeight);
  return Math.max(0, index - bufferSize);
});

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / lineHeight);
  const index = Math.floor(scrollTop.value / lineHeight) + visibleCount;
  return Math.min(lines.value.length - 1, index + bufferSize);
});

const visibleLines = computed(() => {
  if (lines.value.length === 0) return [];
  return lines.value.slice(startIndex.value, endIndex.value + 1);
});

const offsetY = computed(() => startIndex.value * lineHeight);

function onScroll() {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
}

function updateContainerHeight() {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
}

watch(() => props.content, () => {
  scrollTop.value = 0;
  if (containerRef.value) {
    containerRef.value.scrollTop = 0;
  }
  nextTick(updateContainerHeight);
}, { immediate: true });

watch(() => lines.value.length, () => {
  nextTick(updateContainerHeight);
}, { immediate: true });

onMounted(() => {
  nextTick(updateContainerHeight);
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateContainerHeight());
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.virtual-text-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
}

.virtual-text-spacer {
  width: 100%;
}

.virtual-text-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-width: max-content;
}

.virtual-text-line {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: var(--text-sm, 13px);
  line-height: 1;
  white-space: pre;
  color: #D4D4D4;
  padding: 0 4px;
  box-sizing: border-box;
}

.virtual-text-line:hover {
  background-color: rgba(255, 255, 255, 0.03);
}
</style>
