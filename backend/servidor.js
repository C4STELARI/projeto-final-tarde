const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const express = require('express')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()
const port = Number(process.env.PORT || 3000)
const dataFile = process.env.DATA_FILE || path.join(__dirname, 'data', 'store.json')
const uploadsDirectory = process.env.UPLOADS_DIRECTORY || path.join(__dirname, 'uploads')
const assetsDirectory = path.resolve(__dirname, '..', 'frontend', 'projeto-final-tarde', 'src', 'assets')
const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
])
const tokens = new Set()
const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || ''
const adminSalt = 'projeto-final-tarde-demo-auth'
const adminPasswordHash = adminPassword
  ? crypto.scryptSync(adminPassword, adminSalt, 64)
  : null
const maxImageBytes = 8 * 1024 * 1024

function createInitialStore() {
  return {
    profile: {
      name: 'Seu Nome',
      username: 'seu_perfil',
      bio: '⭐ Colecionando momentos, não coisas',
      location: 'Fortaleza, Brasil',
      avatar: '/media/seu_perfil.jpg',
      isPrivate: false,
      notifications: true,
    },
    posts: [
      {
        id: 'post-mariana',
        username: 'mariana.costa',
        location: 'Rio de Janeiro, Brasil',
        avatar: '/media/mariana.jpg',
        image: '/media/img1.jpg',
        caption: 'Parte 3: Maçãzete muda de look',
        likes: 1284,
        createdAt: '2026-11-01T12:00:00.000Z',
        isOwner: false,
      },
      {
        id: 'post-pedro',
        username: 'pedro.viagens',
        location: 'Chapada dos Veadeiros',
        avatar: '/media/pedro.jpg',
        image: '/media/img2.jpg',
        caption: 'Primeiro dia indo ver a sogra',
        likes: 896,
        createdAt: '2026-11-02T12:00:00.000Z',
        isOwner: false,
      },
    ],
  }
}

function readStore() {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true })

  if (!fs.existsSync(dataFile)) {
    const initialStore = createInitialStore()
    fs.writeFileSync(dataFile, JSON.stringify(initialStore, null, 2))
    return initialStore
  }

  const store = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  if (!store.profile || !Array.isArray(store.posts)) {
    throw new Error(`O arquivo de dados ${dataFile} tem um formato inválido.`)
  }

  return store
}

let store = readStore()
fs.mkdirSync(uploadsDirectory, { recursive: true })

function saveStore() {
  const temporaryFile = `${dataFile}.tmp`
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2))
  fs.renameSync(temporaryFile, dataFile)
}

app.use((req, res, next) => {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json({ limit: '12mb' }))
app.use('/media', express.static(assetsDirectory))
app.use('/uploads', express.static(uploadsDirectory))

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!token || !tokens.has(token)) {
    return res.status(401).json({ error: 'Sessão inválida. Entre novamente.' })
  }

  next()
}

function isValidPassword(password) {
  const providedHash = crypto.scryptSync(password, adminSalt, 64)
  return crypto.timingSafeEqual(providedHash, adminPasswordHash)
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!adminPasswordHash || email !== adminEmail || !isValidPassword(password)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
  }

  const token = crypto.randomBytes(32).toString('hex')
  tokens.add(token)
  res.json({ token })
})

app.get('/api/posts', requireAuth, (req, res) => {
  res.json([...store.posts].sort((first, second) => second.createdAt.localeCompare(first.createdAt)))
})

app.get('/api/profile', requireAuth, (req, res) => {
  const posts = store.posts
    .filter((post) => post.isOwner)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))

  res.json({ profile: store.profile, posts })
})

app.patch('/api/profile', requireAuth, (req, res) => {
  const fields = ['name', 'username', 'bio', 'location']
  const updates = {}

  for (const field of fields) {
    if (req.body?.[field] !== undefined) {
      if (typeof req.body[field] !== 'string' || req.body[field].length > 150) {
        return res.status(400).json({ error: `O campo ${field} deve ser um texto de até 150 caracteres.` })
      }
      updates[field] = req.body[field].trim()
    }
  }

  for (const field of ['isPrivate', 'notifications']) {
    if (req.body?.[field] !== undefined) {
      if (typeof req.body[field] !== 'boolean') {
        return res.status(400).json({ error: `O campo ${field} deve ser verdadeiro ou falso.` })
      }
      updates[field] = req.body[field]
    }
  }

  if (updates.username !== undefined && !/^[a-zA-Z0-9._]{1,30}$/.test(updates.username)) {
    return res.status(400).json({ error: 'O nome de usuário pode conter letras, números, ponto e sublinhado.' })
  }

  store.profile = { ...store.profile, ...updates }
  store.posts = store.posts.map((post) => (
    post.isOwner
      ? {
          ...post,
          username: store.profile.username,
          location: store.profile.location,
          avatar: store.profile.avatar,
        }
      : post
  ))
  saveStore()
  res.json(store.profile)
})

app.post('/api/posts', requireAuth, (req, res) => {
  const { imageData, caption = '' } = req.body || {}

  if (typeof caption !== 'string' || caption.length > 2200) {
    return res.status(400).json({ error: 'A legenda deve ter até 2.200 caracteres.' })
  }

  if (typeof imageData !== 'string') {
    return res.status(400).json({ error: 'Selecione uma imagem JPG ou PNG.' })
  }

  const match = imageData.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match) {
    return res.status(400).json({ error: 'O arquivo deve ser uma imagem JPG ou PNG válida.' })
  }

  const [, imageType, encodedImage] = match
  const imageBuffer = Buffer.from(encodedImage, 'base64')
  if (imageBuffer.length === 0 || imageBuffer.length > maxImageBytes) {
    return res.status(400).json({ error: 'A imagem deve ter no máximo 8 MB.' })
  }

  const isJpeg = imageType === 'jpeg'
    && imageBuffer[0] === 0xff
    && imageBuffer[1] === 0xd8
    && imageBuffer[2] === 0xff
  const isPng = imageType === 'png'
    && imageBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

  if (!isJpeg && !isPng) {
    return res.status(400).json({ error: 'O conteúdo do arquivo não corresponde a uma imagem JPG ou PNG.' })
  }

  const extension = isJpeg ? 'jpg' : 'png'
  const fileName = `${crypto.randomUUID()}.${extension}`
  const filePath = path.join(uploadsDirectory, fileName)
  fs.writeFileSync(filePath, imageBuffer, { flag: 'wx' })

  const post = {
    id: crypto.randomUUID(),
    username: store.profile.username,
    location: store.profile.location,
    avatar: store.profile.avatar,
    image: `/uploads/${fileName}`,
    caption: caption.trim(),
    likes: 0,
    createdAt: new Date().toISOString(),
    isOwner: true,
  }

  store.posts.push(post)
  try {
    saveStore()
  } catch (error) {
    store.posts = store.posts.filter((savedPost) => savedPost.id !== post.id)
    fs.unlinkSync(filePath)
    throw error
  }

  res.status(201).json(post)
})

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  console.error(error)
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' })
})

if (require.main === module) {
  if (!adminEmail || !adminPasswordHash) {
    console.error('Configure ADMIN_EMAIL e ADMIN_PASSWORD no arquivo backend/.env.')
    process.exitCode = 1
  } else {
    app.listen(port, () => {
      console.log(`API disponível em http://localhost:${port}`)
    })
  }
}

module.exports = app
