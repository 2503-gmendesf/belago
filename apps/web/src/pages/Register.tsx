import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { Icon } from '../components/Icon.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/ToastProvider.js';
import { roleHome } from '../routes/RoleRoute.js';
import './login.css';

const MIN_PASSWORD = 8;

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function Register() {
  const { user, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return toast('Informe seu nome completo');
    if (password.length < MIN_PASSWORD) return toast(`A senha precisa ter ao menos ${MIN_PASSWORD} caracteres`);
    setSubmitting(true);
    try {
      const created = await signUp({ name: name.trim(), email: email.trim(), phone, password });
      if (created) {
        toast('Bem-vinda, ' + created.name.split(' ')[0]);
        navigate(roleHome(created.role), { replace: true });
      } else {
        toast('Conta criada. Confirme seu e-mail para entrar.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível criar a conta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app login">
      <div className="login-top">
        <button className="icon-btn flat" onClick={() => navigate('/login')} aria-label="Voltar">
          <Icon name="chev-l" />
        </button>
        <p className="h3">Criar conta</p>
      </div>

      <div className="login-scroll">
        <h1 className="h1" style={{ marginTop: 20 }}>
          Crie sua conta
        </h1>
        <p className="muted" style={{ margin: '6px 0 22px' }}>
          Agende em minutos
        </p>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="field">
            <label htmlFor="reg-name">Nome completo</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              placeholder="Seu nome completo"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">Telefone</label>
            <input
              id="reg-phone"
              className="input"
              type="tel"
              placeholder="(31) 99999-9999"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-pass">Senha</label>
            <input
              id="reg-pass"
              className="input"
              type="password"
              placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <p className="tiny muted register-terms">
            Ao criar sua conta você concorda com os{' '}
            <Link to="/legal" target="_blank">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link to="/legal" target="_blank">
              Política de Privacidade
            </Link>
            .
          </p>
          <Button type="submit" disabled={submitting}>
            Criar conta
          </Button>
        </form>
      </div>
    </div>
  );
}
