import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-json-db',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const dbPath = path.resolve(__dirname, '../db.json')

          if (req.url === '/api/profile' && req.method === 'GET') {
            try {
              if (fs.existsSync(dbPath)) {
                const data = fs.readFileSync(dbPath, 'utf-8')
                res.setHeader('Content-Type', 'application/json')
                res.end(data)
              } else {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Not found' }))
              }
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
            return
          }

          if (req.url === '/api/profile' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const newData = JSON.parse(body)
                let currentDb = {}
                if (fs.existsSync(dbPath)) {
                  currentDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
                }

                // Assuming we store profiles by user ID or registration number
                // For this demo, we'll just store a single profile or a map
                const updatedDb = { ...currentDb, ...newData }

                fs.writeFileSync(dbPath, JSON.stringify(updatedDb, null, 2))
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, data: updatedDb }))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: err.message }))
              }
            })
            return
          }

          next()
        })
      }
    }
  ],
})
