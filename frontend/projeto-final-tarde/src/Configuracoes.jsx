import { useState } from 'react'
import { useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { apiRequest, clearAuthToken, mediaUrl } from './api'
import seuPerfil from './assets/seu_perfil.jpg'
import './Configuracoes.css'

function Configuracoes() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest('/api/profile')
      .then(({ profile: savedProfile }) => {
        if (active) setProfile(savedProfile)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })

    return () => {
      active = false
    }
  }, [])

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const updatedProfile = await apiRequest('/api/profile', {
        method: 'PATCH',
        body: profile,
      })
      setProfile(updatedProfile)
      setSaved(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function sair() {
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="settings-app">
      <aside className="settings-sidebar">
        <Link className="settings-wordmark" to="/feed">Instagram</Link>
        <nav className="settings-navigation" aria-label="Navegação principal">
          <NavLink to="/feed"><span aria-hidden="true">⌂</span> Início</NavLink>
          <NavLink to="/perfil"><span aria-hidden="true">◉</span> Perfil</NavLink>
          <NavLink to="/configuracoes"><span aria-hidden="true">⚙</span> Configurações</NavLink>
        </nav>
        <Link className="settings-account" to="/perfil">
          <img src={mediaUrl(profile?.avatar) || seuPerfil} alt="" />
          <span>{profile?.username || 'seu_perfil'}</span>
        </Link>
      </aside>

      <main className="settings-main">
        <section className="settings-page">
          <h1>Configurações</h1>
          {error && <p className="settings-message error" role="alert">{error}</p>}
          {saved && <p className="settings-message success" role="status">Perfil atualizado.</p>}
          {!profile && !error && <p>Carregando configurações...</p>}
          {profile && (
            <form onSubmit={saveProfile}>
              <div className="settings-panel">
                <h2>Informações do perfil</h2>
                <label className="settings-field">
                  Nome
                  <input maxLength="150" onChange={(event) => updateProfile('name', event.target.value)} value={profile.name} />
                </label>
                <label className="settings-field">
                  Nome de usuário
                  <input maxLength="30" onChange={(event) => updateProfile('username', event.target.value)} value={profile.username} />
                </label>
                <label className="settings-field">
                  Bio
                  <textarea maxLength="150" onChange={(event) => updateProfile('bio', event.target.value)} rows="3" value={profile.bio} />
                </label>
                <label className="settings-field">
                  Localização
                  <input maxLength="150" onChange={(event) => updateProfile('location', event.target.value)} value={profile.location} />
                </label>
              </div>

              <div className="settings-panel">
                <h2>Preferências</h2>
                <label className="setting-row">
                  <span>
                    <strong>Conta privada</strong>
                    <small>Somente seguidores aprovados poderão ver suas publicações.</small>
                  </span>
                  <input
                    checked={profile.isPrivate}
                    onChange={(event) => updateProfile('isPrivate', event.target.checked)}
                    type="checkbox"
                  />
                </label>
                <label className="setting-row">
                  <span>
                    <strong>Notificações</strong>
                    <small>Receba avisos sobre curtidas, comentários e novos seguidores.</small>
                  </span>
                  <input
                    checked={profile.notifications}
                    onChange={(event) => updateProfile('notifications', event.target.checked)}
                    type="checkbox"
                  />
                </label>
              </div>
              <button className="settings-save" disabled={saving} type="submit">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          )}

          <div className="settings-panel">
            <h2>Conta</h2>
            <Link className="settings-link" to="/perfil">Ver perfil <span>›</span></Link>
            <button className="settings-logout" onClick={sair} type="button">Sair da conta</button>
          </div>
        </section>
      </main>

      <nav className="settings-mobile-nav" aria-label="Navegação principal">
        <NavLink to="/feed" aria-label="Início">⌂</NavLink>
        <NavLink to="/perfil" aria-label="Perfil">◉</NavLink>
        <NavLink to="/configuracoes" aria-label="Configurações">⚙</NavLink>
      </nav>
    </div>
  )
}

export default Configuracoes
