<script setup>
import MusicPlayer from './components/MusicPlayer.vue'
</script>

<template>
  <div class="app">
    <MusicPlayer />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}
</style>
