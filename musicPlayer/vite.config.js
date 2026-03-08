import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

// 读取音乐文件的插件
function musicScannerPlugin() {
  const musicDir = 'G:/asn/小美/小美' // 你可以修改为你的音乐文件夹路径
  
  return {
    name: 'music-scanner',
    configureServer(server) {
      server.middlewares.use('/api/music', (req, res, next) => {
        if (req.url === '/list') {
          try {
            // 检查音乐文件夹是否存在
            if (!fs.existsSync(musicDir)) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ 
                success: false, 
                message: `音乐文件夹不存在: ${musicDir}`,
                songs: []
              }))
              return
            }
            
            // 读取音乐文件
            const files = fs.readdirSync(musicDir)
            const musicFiles = files.filter(file => {
              const ext = path.extname(file).toLowerCase()
              return ['.mp3', '.wav', '.ogg', '.flac', '.m4a'].includes(ext)
            })
            
            const songs = musicFiles.map((file, index) => ({
              id: index,
              title: path.basename(file, path.extname(file)),
              artist: '本地音乐',
              url: `/music/${encodeURIComponent(file)}`,
              filePath: path.join(musicDir, file)
            }))
            
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ 
              success: true, 
              songs,
              musicDir
            }))
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ 
              success: false, 
              message: error.message,
              songs: []
            }))
          }
        } else {
          next()
        }
      })
      
      // 提供静态文件服务
      server.middlewares.use('/music', (req, res, next) => {
        try {
          const fileName = decodeURIComponent(req.url.slice(1))
          const filePath = path.join(musicDir, fileName)
          
          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            const ext = path.extname(filePath).toLowerCase()
            const mimeTypes = {
              '.mp3': 'audio/mpeg',
              '.wav': 'audio/wav',
              '.ogg': 'audio/ogg',
              '.flac': 'audio/flac',
              '.m4a': 'audio/mp4'
            }
            
            res.writeHead(200, {
              'Content-Type': mimeTypes[ext] || 'audio/mpeg',
              'Content-Length': stat.size,
              'Accept-Ranges': 'bytes'
            })
            
            const readStream = fs.createReadStream(filePath)
            readStream.pipe(res)
          } else {
            res.writeHead(404)
            res.end('File not found')
          }
        } catch (error) {
          res.writeHead(500)
          res.end(error.message)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    musicScannerPlugin()
  ],
  server: {
    port: 3000,
    cors: true
  }
})
