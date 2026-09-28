import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import './styles/global.css';
import './components/Button.css';
import './components/Card.css';
import './components/MenuRow.css';
import './components/Icon.css';
import './components/Toast.css';
import './components/Overlay.css';
import './components/TabBar.css';
import './features/discovery/components/discovery.css';
import './features/booking/booking.css';
import './features/appointments/components/appointments.css';
import './features/profile/components/profile.css';
import './features/proAgenda/components/proAgenda.css';
import './features/proServices/components/proServices.css';
import './features/proFinance/components/proFinance.css';
import './features/proProfile/components/proProfile.css';
import './features/admin/components/admin.css';
import './pages/legal.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
