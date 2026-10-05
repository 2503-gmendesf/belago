import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { Icon } from '../components/Icon.js';
import './onboarding.css';

const SLIDES = [
  {
    icon: 'sparkle',
    title: ['Sua beleza,', 'do seu jeito'],
    text: 'Agende cabelo, unhas, maquiagem e muito mais. As melhores profissionais perto de você.',
  },
  {
    icon: 'shield-check',
    title: ['Profissionais', 'verificadas'],
    text: 'Todas passam por verificação de identidade, portfólio e avaliação de clientes.',
  },
  {
    icon: 'bolt',
    title: ['Agende', 'em segundos'],
    text: 'Escolha o serviço, o dia e o horário. Confirmação instantânea, sem burocracia.',
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const last = step === SLIDES.length - 1;

  function goLogin() {
    navigate('/login');
  }

  return (
    <div className="app ob">
      <div className="ob-top">
        <div className="wordmark">
          <i />
          BelaGo
        </div>
        <button className="small muted ob-skip" onClick={goLogin}>
          Pular
        </button>
      </div>

      <div className="ob-viewport">
        <div className="ob-track" style={{ transform: `translateX(-${step * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <section key={s.icon} className="ob-slide" aria-hidden={i !== step}>
              <div className="ob-big">
                <Icon name={s.icon} />
              </div>
              <h2 className="h1">
                {s.title[0]}
                <br />
                {s.title[1]}
              </h2>
              <p className="muted">{s.text}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="ob-bottom">
        <div className="ob-dots">
          {SLIDES.map((s, i) => (
            <div key={s.icon} className={i === step ? 'ob-dot active' : 'ob-dot'} />
          ))}
        </div>
        <Button onClick={() => (last ? goLogin() : setStep(step + 1))}>{last ? 'Começar' : 'Próximo'}</Button>
        <Button variant="ghost" style={{ marginTop: 6 }} onClick={goLogin}>
          Já tenho conta — entrar
        </Button>
      </div>
    </div>
  );
}
