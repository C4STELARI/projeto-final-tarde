const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { after, before, test } = require('node:test')

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'projeto-social-api-'))
process.env.DATA_FILE = path.join(temporaryDirectory, 'store.json')
process.env.UPLOADS_DIRECTORY = path.join(temporaryDirectory, 'uploads')
process.env.ADMIN_EMAIL = 'test@example.com'
process.env.ADMIN_PASSWORD = 'TestPass@123'

const app = require('./servidor')
let server
let baseUrl

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server.closeAllConnections()
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  fs.rmSync(temporaryDirectory, { recursive: true, force: true })
})

async function request(route, { token, body, ...options } = {}) {
  const headers = new Headers(options.headers)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${baseUrl}${route}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

test('requires a valid login before returning the feed', async () => {
  const unauthorized = await request('/api/posts')
  assert.equal(unauthorized.status, 401)

  const invalidLogin = await request('/api/login', {
    method: 'POST',
    body: { email: 'test@example.com', password: 'senha-incorreta' },
  })
  assert.equal(invalidLogin.status, 401)
})

test('returns posts, saves profile settings and accepts photo uploads', async () => {
  const loginResponse = await request('/api/login', {
    method: 'POST',
    body: { email: 'test@example.com', password: 'TestPass@123' },
  })
  assert.equal(loginResponse.status, 200)
  const { token } = await loginResponse.json()

  const postsResponse = await request('/api/posts', { token })
  const initialPosts = await postsResponse.json()
  assert.equal(initialPosts.length, 2)

  const profileResponse = await request('/api/profile', { token })
  const { profile } = await profileResponse.json()
  const updateResponse = await request('/api/profile', {
    method: 'PATCH',
    token,
    body: { ...profile, username: 'teste_api', name: 'Teste API' },
  })
  assert.equal(updateResponse.status, 200)

  const imagePath = path.resolve(
    __dirname,
    '..',
    'frontend',
    'projeto-final-tarde',
    'src',
    'assets',
    'img1.jpg',
  )
  const imageData = `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString('base64')}`
  const uploadResponse = await request('/api/posts', {
    method: 'POST',
    token,
    body: { imageData, caption: 'Foto enviada pelo teste' },
  })
  assert.equal(uploadResponse.status, 201)
  const uploadedPost = await uploadResponse.json()
  assert.equal(uploadedPost.username, 'teste_api')

  const feedResponse = await request('/api/posts', { token })
  const feedPosts = await feedResponse.json()
  assert.equal(feedPosts.length, 3)
  assert.ok(feedPosts.some((post) => post.id === uploadedPost.id))

  const updatedProfileResponse = await request('/api/profile', { token })
  const updatedProfile = await updatedProfileResponse.json()
  assert.equal(updatedProfile.profile.username, 'teste_api')
  assert.equal(updatedProfile.posts.length, 1)

  const imageResponse = await fetch(`${baseUrl}${uploadedPost.image}`)
  assert.equal(imageResponse.status, 200)
})

test('rejects invalid photo content', async () => {
  const loginResponse = await request('/api/login', {
    method: 'POST',
    body: { email: 'test@example.com', password: 'TestPass@123' },
  })
  const { token } = await loginResponse.json()
  const response = await request('/api/posts', {
    method: 'POST',
    token,
    body: { imageData: 'data:image/jpeg;base64,aGVsbG8=', caption: '' },
  })

  assert.equal(response.status, 400)
})
