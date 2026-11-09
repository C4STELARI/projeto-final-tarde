import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { apiRequest, mediaUrl } from './api'
import seuPerfil from './assets/seu_perfil.jpg'
import mariana from './assets/mariana.jpg'
import img1 from './assets/img1.jpg'
import img2 from './assets/img2.jpg'
import './Perfil.css'

const highlights = [
  { name: 'viagens', image: img2 },
  { name: 'momentos', image: img1 },
  { name: 'amigos', image: mariana },
]

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  })
}

function Perfil() {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('publicacoes')
  const [selectedFile, setSelectedFile] = useState(null)
  const [imageData, setImageData] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInput = useRef(null)

  useEffect(() => {
    let active = true
    apiRequest('/api/profile')
      .then(({ profile: loadedProfile, posts: loadedPosts }) => {
        if (active) {
          setProfile(loadedProfile)
          setPosts(loadedPosts)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    setUploadError('')
    setSuccess('')
    setSelectedFile(null)
    setImageData('')

    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Escolha uma imagem JPG ou PNG.')
      event.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 8 MB.')
      event.target.value = ''
      return
    }

    try {
      const data = await readImage(file)
      setSelectedFile(file)
      setImageData(data)
    } catch (readError) {
      setUploadError(readError.message)
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!selectedFile || !imageData) {
      setUploadError('Selecione uma imagem JPG ou PNG.')
      return
    }

    setUploading(true)
    setUploadError('')
    setSuccess('')
    try {
      const post = await apiRequest('/api/posts', {
        method: 'POST',
        body: { imageData, caption },
      })
      setPosts((current) => [post, ...current])
      setCaption('')
      setSelectedFile(null)
      setImageData('')
      if (fileInput.current) fileInput.current.value = ''
      setSuccess('Sua foto foi publicada.')
    } catch (requestError) {
      setUploadError(requestError.message)
    } finally {
      setUploading(false)
    }
  }

  const avatar = mediaUrl(profile?.avatar) || seuPerfil

  return (
    <div className="profile-app">
      <aside className="profile-sidebar">
        <Link className="profile-wordmark" to="/feed">Instagram</Link>
        <nav className="profile-navigation" aria-label="Navegação principal">
          <NavLink to="/feed"><span aria-hidden="true">⌂</span> Início</NavLink>
          <NavLink to="/perfil"><span aria-hidden="true">◉</span> Perfil</NavLink>
          <NavLink to="/configuracoes"><span aria-hidden="true">⚙</span> Configurações</NavLink>
        </nav>
        <Link className="profile-account" to="/perfil">
          <img src={avatar} alt="" />
          <span>{profile?.username || 'seu_perfil'}</span>
        </Link>
      </aside>

      <main className="profile-main">
        <section className="profile-page" aria-label="Perfil">
          {loading && <p className="profile-status">Carregando perfil...</p>}
          {error && <p className="profile-status error" role="alert">{error}</p>}
          {profile && (
            <>
              <header className="profile-header">
                <img className="profile-avatar" src={avatar} alt={`Foto de perfil de ${profile.username}`} />
                <div className="profile-details">
                  <div className="profile-title">
                    <h1>{profile.username}</h1>
                    <Link className="profile-message" to="/configuracoes">Editar perfil</Link>
                  </div>
                  <div className="profile-stats">
                    <span><strong>{posts.length}</strong> publicações</span>
                    <span><strong>1.280</strong> seguidores</span>
                    <span><strong>846</strong> seguindo</span>
                  </div>
                  <div className="profile-bio">
                    <strong>{profile.name}</strong>
                    <p>{profile.bio}</p>
                    <span>📍 {profile.location}</span>
                  </div>
                </div>
              </header>

              <div className="profile-highlights" aria-label="Destaques">
                {highlights.map(({ name, image }) => (
                  <button className="highlight" key={name} type="button">
                    <span><img src={image} alt="" /></span>
                    <small>{name}</small>
                  </button>
                ))}
              </div>

              <section className="profile-upload-section" aria-label="Publicar uma foto">
                <h2>Compartilhe uma foto</h2>
                <form className="profile-upload-form" onSubmit={handleUpload}>
                  <label className="profile-file-field">
                    <span>Imagem JPG ou PNG (máximo 8 MB)</span>
                    <input
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      ref={fileInput}
                      type="file"
                    />
                  </label>
                  {selectedFile && <p className="selected-file">{selectedFile.name}</p>}
                  <label className="profile-caption-field">
                    <span>Legenda</span>
                    <textarea
                      maxLength="2200"
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="Escreva uma legenda..."
                      rows="2"
                      value={caption}
                    />
                  </label>
                  <button className="profile-publish" disabled={uploading} type="submit">
                    {uploading ? 'Enviando...' : 'Publicar'}
                  </button>
                </form>
                {uploadError && <p className="profile-status error" role="alert">{uploadError}</p>}
                {success && <p className="profile-status success" role="status">{success}</p>}
              </section>

              <nav className="profile-tabs" aria-label="Publicações do perfil">
                <button
                  aria-pressed={activeTab === 'publicacoes'}
                  className={activeTab === 'publicacoes' ? 'selected' : ''}
                  onClick={() => setActiveTab('publicacoes')}
                  type="button"
                >
                  <span aria-hidden="true">▦</span> PUBLICAÇÕES
                </button>
                <button
                  aria-pressed={activeTab === 'marcacoes'}
                  className={activeTab === 'marcacoes' ? 'selected' : ''}
                  onClick={() => setActiveTab('marcacoes')}
                  type="button"
                >
                  <span aria-hidden="true">♙</span> MARCAÇÕES
                </button>
              </nav>

              {activeTab === 'publicacoes' ? (
                posts.length ? (
                  <div className="profile-grid">
                    {posts.map((post) => (
                      <div className="profile-grid-item" key={post.id}>
                        <img src={mediaUrl(post.image)} alt={post.caption || 'Foto publicada no perfil'} />
                        <span aria-hidden="true">♥ &nbsp; {post.likes}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-tagged">
                    <span aria-hidden="true">▧</span>
                    <h2>Compartilhe fotos</h2>
                    <p>As fotos que você publicar aparecerão aqui.</p>
                  </div>
                )
              ) : (
                <div className="empty-tagged">
                  <span aria-hidden="true">♙</span>
                  <h2>Fotos com você</h2>
                  <p>Quando alguém marcar você em uma foto, ela aparecerá aqui.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <nav className="profile-mobile-nav" aria-label="Navegação principal">
        <NavLink to="/feed" aria-label="Início">⌂</NavLink>
        <NavLink to="/perfil" aria-label="Perfil">◉</NavLink>
        <NavLink to="/configuracoes" aria-label="Configurações">⚙</NavLink>
      </nav>
    </div>
  )
}

export default Perfil
