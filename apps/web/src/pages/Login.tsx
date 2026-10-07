import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { Icon } from '../components/Icon.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/ToastProvider.js';
import { roleHome } from '../routes/RoleRoute.js';
import './login.css';

export function Login() {
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  async function attemptLogin(loginEmail: string, loginPassword: string) {
    setSubmitting(true);
    try {
      const loggedUser = await signIn(loginEmail, loginPassword);
      toast('Bem-vinda, ' + loggedUser.name.split(' ')[0]);
      navigate(roleHome(loggedUser.role), { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível entrar');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void attemptLogin(email, password);
  }

  return (
    <div className="app login">
      <div className="login-top">
        <button className="icon-btn flat" onClick={() => navigate('/')} aria-label="Voltar">
          <Icon name="chev-l" />
        </button>
        <div className="wordmark">
          <i />
          BelaGo
        </div>
      </div>

      <div className="login-scroll">
        <h1 className="h1" style={{ marginTop: 20 }}>
          Bem-vinda de volta
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Entre para agendar com as melhores profissionais
        </p>

        <div className="stack gap8" style={{ marginTop: 24 }}>
          <Button type="button" variant="sec" onClick={() => toast('Login com Google em breve')}>
            <Icon name="google" className="fill" />
            Continuar com Google
          </Button>
          <Button type="button" variant="sec" onClick={() => toast('Login com Apple em breve')}>
            <Icon name="apple" className="fill" />
            Continuar com Apple
          </Button>
        </div>

        <div className="or">ou use seu e-mail</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field login-pass">
            <label htmlFor="login-pass">Senha</label>
            <input
              id="login-pass"
              className="input"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} />
            </button>
          </div>
          <div className="login-forgot">
            <button type="button" className="small muted" onClick={() => toast('Link de recuperação enviado para seu e-mail')}>
              Esqueceu a senha?
            </button>
          </div>
          <Button type="submit" disabled={submitting}>
            Entrar
          </Button>
        </form>

        <p className="small muted login-register">
          Não tem conta?{' '}
          <button type="button" onClick={() => navigate('/cadastro')}>
            Cadastre-se grátis
          </button>
        </p>
      </div>
    </div>
  );
}
