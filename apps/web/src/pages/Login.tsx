import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/ToastProvider.js';
import { roleHome } from '../routes/RoleRoute.js';

const QUICK_LOGINS = [
  { label: 'Cliente demo', email: 'cliente@belago.app' },
  { label: 'Profissional demo', email: 'profissional@belago.app' },
  { label: 'Admin demo', email: 'admin@belago.app' },
];

export function Login() {
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
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
    <div className="app">
      <div className="screen stack gap16">
        <h1 className="h1">Entrar no BelaGo</h1>
        <form className="stack gap12" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-pass">Senha</label>
            <input
              id="login-pass"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={submitting}>
            Entrar
          </Button>
        </form>
        <div className="demo stack gap8">
          <p className="eyebrow">Contas demo</p>
          {QUICK_LOGINS.map((q) => (
            <Button
              key={q.email}
              type="button"
              variant="sec"
              size="sm"
              disabled={submitting}
              onClick={() => void attemptLogin(q.email, '123456')}
            >
              {q.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
