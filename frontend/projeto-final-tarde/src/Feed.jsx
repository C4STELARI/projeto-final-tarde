import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { apiRequest, mediaUrl } from './api'
import seuPerfil from './assets/seu_perfil.jpg'
import mariana from './assets/mariana.jpg'
import pedro from './assets/pedro.jpg'
import camila from './assets/camila.jpg'
import lucas from './assets/lucas.jpg'
import julia from './assets/julia.jpg'
import './Feed.css'

const stories = [
  { name: 'seu_perfil', image: seuPerfil },
  { name: 'mariana', image: mariana },
  { name: 'pedro', image: pedro },
  { name: 'camila', image: camila },
  { name: 'lucas', image: lucas },
  { name: 'julia', image: julia },
]

function FeedPost({ post }) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="feed-post">
      <header className="post-header">
        <img className="post-avatar" src={mediaUrl(post.avatar)} alt="" />
        <div className="post-author">
          <strong>{post.username}</strong>
          <span>{post.location}</span>
        </div>
        <button className="more-button" type="button" aria-label={`Mais opções para a publicação de ${post.username}`}>···</button>
      </header>

      <img className="post-image" src={mediaUrl(post.image)} alt={`Publicação de ${post.username}`} />

      <div className="post-content">
        <div className="post-actions">
          <button
            aria-label={liked ? 'Descurtir publicação' : 'Curtir publicação'}
            aria-pressed={liked}
            className={`post-action like-action${liked ? ' liked' : ''}`}
            onClick={() => setLiked((current) => !current)}
            type="button"
          >
            {liked ? '♥' : '♡'}
          </button>
          <button className="post-action" type="button" aria-label="Comentar">◯</button>
          <button className="post-action share-action" type="button" aria-label="Compartilhar">➤</button>
          <button className="post-action save-action" type="button" aria-label="Salvar publicação">♧</button>
        </div>
        <strong className="post-likes">{(post.likes + Number(liked)).toLocaleString('pt-BR')} curtidas</strong>
        <p className="post-caption"><strong>{post.username}</strong> {post.caption}</p>
        <button className="comments-link" type="button">Ver todos os 32 comentários</button>
        <form className="comment-form" onSubmit={(event) => event.preventDefault()}>
          <label className="visually-hidden" htmlFor={`comment-${post.id}`}>Adicione um comentário</label>
          <input id={`comment-${post.id}`} placeholder="Adicione um comentário..." />
          <button type="submit">Publicar</button>
        </form>
      </div>
    </article>
  )
}

function Feed() {
  const [posts, setPosts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([apiRequest('/api/posts'), apiRequest('/api/profile')])
      .then(([loadedPosts, { profile: loadedProfile }]) => {
        if (active) {
          setPosts(loadedPosts)
          setProfile(loadedProfile)
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

  const visibleStories = stories.map((story, index) => (
    index === 0 && profile ? { ...story, name: profile.username } : story
  ))

  return (
    <div className="feed-page">
      <aside className="feed-sidebar">
        <Link className="feed-wordmark" to="/feed">Instagram</Link>
        <nav className="feed-navigation" aria-label="Navegação principal">
          <NavLink to="/feed"><span aria-hidden="true">⌂</span> Início</NavLink>
          <NavLink to="/perfil"><span aria-hidden="true">◉</span> Perfil</NavLink>
          <NavLink to="/configuracoes"><span aria-hidden="true">⚙</span> Configurações</NavLink>
        </nav>
        <Link className="feed-account" to="/perfil">
          <img src={mediaUrl(profile?.avatar) || seuPerfil} alt="" />
          <span>{profile?.username || 'seu_perfil'}</span>
        </Link>
      </aside>

      <main className="feed-main">
        <div className="feed-layout">
          <section className="feed-column" aria-label="Feed de publicações">
            <div className="stories-row" aria-label="Stories">
              {visibleStories.map(({ name, image }) => (
                <Link className="story" key={name} to="/perfil">
                  <span className="story-ring">
                    <img src={image} alt="" />
                  </span>
                  <span>{name}</span>
                </Link>
              ))}
            </div>

            <div className="posts-list">
              {posts.map((post) => <FeedPost key={post.id} post={post} />)}
            </div>
            {loading && <p className="feed-status">Carregando publicações...</p>}
            {error && <p className="feed-status error" role="alert">{error}</p>}
            {!loading && !error && posts.length === 0 && (
              <p className="feed-status">Ainda não há publicações.</p>
            )}
          </section>

        </div>
      </main>

      <nav className="feed-mobile-nav" aria-label="Navegação principal">
        <NavLink to="/feed" aria-label="Início">⌂</NavLink>
        <NavLink to="/perfil" aria-label="Perfil">◉</NavLink>
        <NavLink to="/configuracoes" aria-label="Configurações">⚙</NavLink>
      </nav>
    </div>
  )
}

export default Feed
