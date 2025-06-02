const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const serverless = require('serverless-http')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '20mb' }))

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog',
    format: async (req, file) => 'jpg',
    public_id: (req, file) => uuidv4()
  }
})

const upload = multer({ storage })

const blogSchema = new mongoose.Schema({
  title: String,
  paragraph1: String,
  createdAt: { type: Date, default: Date.now }
})

const Blog = mongoose.model('Blog', blogSchema)

app.post('/api/upload', upload.single('image'), (req, res) => {
  res.json({ url: req.file.path })
})

app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 })
  res.json(blogs)
})

app.post('/api/blogs', async (req, res) => {
  const newBlog = new Blog(req.body)
  const saved = await newBlog.save()
  res.json(saved)
})

app.delete('/api/blogs/:title', async (req, res) => {
  await Blog.findOneAndDelete({ title: req.params.title })
  res.json({ success: true })
})
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Servidor rodando localmente em http://localhost:${PORT}`)
  })
}

module.exports = app
module.exports.handler = serverless(app)
