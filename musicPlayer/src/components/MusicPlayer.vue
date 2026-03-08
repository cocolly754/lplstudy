<template>
  <div class="music-player">
    <div class="player-header">
      <h2>🎵 音乐播放器</h2>
    </div>
    
    <!-- 文件选择区域 -->
    <div class="file-selector">
      <label for="fileInput" class="file-label">
        <span>📁 选择本地音乐</span>
        <input 
          id="fileInput" 
          type="file" 
          accept="audio/*" 
          multiple 
          @change="handleFileSelect" 
          class="file-input"
        />
      </label>
      <p class="file-hint">支持 MP3, WAV, OGG 等格式</p>
    </div>
    
    <!-- 播放列表 -->
    <div class="playlist" v-if="songs.length > 0">
      <h3>播放列表 ({{ songs.length }})</h3>
      <div class="playlist-items">
        <div 
          v-for="(song, index) in songs" 
          :key="index"
          class="playlist-item"
          :class="{ active: index === currentSongIndex }"
          @click="playSong(index)"
        >
          <span class="song-number">{{ index + 1 }}</span>
          <div class="song-info-mini">
            <div class="song-title-mini">{{ song.title }}</div>
            <div class="song-artist-mini">{{ song.artist }}</div>
          </div>
          <span class="playing-indicator" v-if="index === currentSongIndex && isPlaying">▶</span>
        </div>
      </div>
    </div>
    
    <div class="album-cover" v-if="songs.length > 0">
      <div class="cover-placeholder">
        <span>🎵</span>
      </div>
    </div>
    
    <div class="song-info" v-if="songs.length > 0">
      <h3 class="song-title">{{ currentSong.title }}</h3>
      <p class="artist">{{ currentSong.artist }}</p>
    </div>
    
    <div class="progress-container" v-if="songs.length > 0">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="time-display">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
    </div>
    
    <div class="controls" v-if="songs.length > 0">
      <button class="control-btn" @click="previousSong" :disabled="songs.length <= 1">
        <span>⏮️</span>
      </button>
      <button class="control-btn play-btn" @click="togglePlay" :disabled="songs.length === 0">
        <span>{{ isPlaying ? '⏸️' : '▶️' }}</span>
      </button>
      <button class="control-btn" @click="nextSong" :disabled="songs.length <= 1">
        <span>⏭️</span>
      </button>
    </div>
    
    <div class="volume-control" v-if="songs.length > 0">
      <span>🔊</span>
      <input type="range" class="volume-slider" min="0" max="100" v-model="volume" @input="updateVolume">
    </div>
    
    <audio 
      ref="audioPlayer" 
      @timeupdate="updateProgress" 
      @loadedmetadata="loadMetadata" 
      @ended="songEnded"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const audioPlayer = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(70)
const currentSongIndex = ref(0)
const loading = ref(true)
const error = ref('')

const songs = ref([])

const currentSong = computed(() => songs.value[currentSongIndex.value] || { title: '请选择音乐', artist: '' })
const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 从后端API加载音乐列表
const loadMusicList = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/music/list')
    const data = await response.json()
    
    if (data.success) {
      songs.value = data.songs
      if (songs.value.length > 0) {
        currentSongIndex.value = 0
        loadSong()
      }
    } else {
      error.value = data.message || '加载音乐失败'
    }
  } catch (err) {
    error.value = '无法连接到音乐服务器: ' + err.message
  } finally {
    loading.value = false
  }
}

// 播放指定歌曲
const playSong = (index) => {
  if (index < 0 || index >= songs.value.length) return
  currentSongIndex.value = index
  loadSong()
  if (!isPlaying.value) {
    togglePlay()
  }
}

const togglePlay = () => {
  if (songs.value.length === 0) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    audioPlayer.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const previousSong = () => {
  if (songs.value.length <= 1) return
  currentSongIndex.value = currentSongIndex.value === 0 ? songs.value.length - 1 : currentSongIndex.value - 1
  loadSong()
}

const nextSong = () => {
  if (songs.value.length <= 1) return
  currentSongIndex.value = (currentSongIndex.value + 1) % songs.value.length
  loadSong()
}

const loadSong = () => {
  if (!audioPlayer.value || songs.value.length === 0) return
  
  const song = songs.value[currentSongIndex.value]
  audioPlayer.value.src = song.url
  audioPlayer.value.load()
  
  if (isPlaying.value) {
    audioPlayer.value.play()
  }
}

const updateProgress = () => {
  if (!audioPlayer.value) return
  currentTime.value = audioPlayer.value.currentTime
}

const loadMetadata = () => {
  if (!audioPlayer.value) return
  duration.value = audioPlayer.value.duration
}

const songEnded = () => {
  nextSong()
}

const updateVolume = () => {
  if (!audioPlayer.value) return
  audioPlayer.value.volume = volume.value / 100
}

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  loadMusicList()
  updateVolume()
})

watch(currentSongIndex, () => {
  loadSong()
})
</script>

<style scoped>
.music-player {
  max-width: 500px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.player-header h2 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
}

/* 文件选择样式 */
.file-selector {
  margin-bottom: 20px;
  text-align: center;
}

.file-label {
  display: inline-block;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-label:hover {
  background: rgba(255, 255, 255, 0.3);
}

.file-input {
  display: none;
}

.file-hint {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 8px;
}

/* 播放列表样式 */
.playlist {
  margin-bottom: 20px;
}

.playlist h3 {
  font-size: 16px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.playlist-items {
  max-height: 150px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.playlist-item.active {
  background: rgba(255, 255, 255, 0.25);
}

.song-number {
  width: 24px;
  font-size: 12px;
  opacity: 0.7;
}

.song-info-mini {
  flex: 1;
  text-align: left;
}

.song-title-mini {
  font-size: 13px;
  font-weight: 500;
}

.song-artist-mini {
  font-size: 11px;
  opacity: 0.7;
}

.playing-indicator {
  color: #4ade80;
  font-size: 12px;
}

/* 原有样式 */
.album-cover {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.cover-placeholder {
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
}

.song-info {
  text-align: center;
  margin-bottom: 20px;
}

.song-title {
  font-size: 18px;
  margin-bottom: 5px;
}

.artist {
  font-size: 14px;
  opacity: 0.8;
}

.progress-container {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress {
  height: 100%;
  background: white;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.8;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-slider {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 滚动条样式 */
.playlist-items::-webkit-scrollbar {
  width: 4px;
}

.playlist-items::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.playlist-items::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style>
