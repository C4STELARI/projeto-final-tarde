import { useState } from 'react'
import { useNavigate } from 'react-router'
import { apiRequest, setAuthToken } from './api'
import loginImage from './assets/login.png'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setEntrando(true)

    try {
      const { token } = await apiRequest('/api/login', {
        method: 'POST',
        body: { email, password: senha },
      })
      setAuthToken(token)
      navigate('/feed')
    } catch (error) {
      setErro(error.message)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-showcase" aria-label="Compartilhe seus momentos">
        <div className="showcase-frame">
          <img
            src={loginImage}
            alt="Momentos compartilhados em uma rede social"
          />
          <div className="showcase-caption">
            <span>Um lugar para</span>
            <strong>compartilhar o que importa.</strong>
          </div>
        </div>
      </div>

      <section className="login-column" aria-label="Entrar no Instagram">
        <div className="login-card">
          <h1 className="login-wordmark">Instagram</h1>
          <p className="login-intro">Entre para ver fotos e vídeos dos seus amigos.</p>

          <form onSubmit={handleSubmit}>
            <label className="login-field">
              <span>E-mail</span>
              <input
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mail"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="login-field">
              <span>Senha</span>
              <input
                autoComplete="current-password"
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Senha"
                required
                type="password"
                value={senha}
              />
            </label>

            <button className="login-submit" disabled={entrando} type="submit">
              {entrando ? 'Entrando...' : 'Entrar'}
            </button>
            {erro && <p className="login-error" role="alert">{erro}</p>}
          </form>

          <div className="login-divider"><span>OU</span></div>
          <button className="facebook-login" type="button">
            <span aria-hidden="true">f</span> Entrar com o Facebook
          </button>
          <a className="forgot-password" href="#esqueceu-senha">Esqueceu a senha?</a>
        </div>

        <div className="signup-card">
          Não tem uma conta? <a href="#cadastro">Cadastre-se</a>
        </div>
        <p className="demo-note">Entre com sua conta para continuar.</p>
        <footer className="login-footer">Português (Brasil) · Sobre · Blog · Carreiras</footer>
      </section>
    </main>
  )
}

export default Login
