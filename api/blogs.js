const express = require('express')
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()
const PORT = 3000
const DB_FILE = path.join(__dirname, 'blogs.json')

app.use(cors())
app.use(bodyParser.json({ limit: '20mb' }))

const loadData = () => {
  if (!fs.existsSync(DB_FILE)) return []
  const content = fs.readFileSync(DB_FILE, 'utf8').trim()
  if (!content) return []
  try {
    return JSON.parse(content)
  } catch {
    return []
  }
}

const saveData = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

app.get('/api/blogs', (req, res) => {
  const blogs = loadData()
  res.status(200).json(blogs)
})

app.post('/api/blogs', (req, res) => {
  const { title, content, coverImage } = req.body
  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' })
  }

  const blogs = loadData()
  const newBlog = {
    id: Date.now(),
    title,
    content,
    coverImage: coverImage || null,
    createdAt: new Date().toISOString()
  }

  blogs.unshift(newBlog)
  saveData(blogs)
  res.status(201).json(newBlog)
})

app.delete('/api/blogs/:id', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const blogs = loadData()
  const filtered = blogs.filter(blog => blog.id !== id)

  if (filtered.length === blogs.length) {
    return res.status(404).json({ error: 'Blog não encontrado' })
  }

  saveData(filtered)
  res.status(200).json({ success: true })
})

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}/api/blogs`)
})
