import React, { useState } from 'react';
import { Calendar, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { loginAgendaUser } from '../../../services/agendaService';
import type { AgendaSessionUser } from '../../../types/agenda';

interface AgendaLoginProps {
  onSuccess: (user: AgendaSessionUser) => void;
}

export const AgendaLogin: React.FC<AgendaLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha seu usuário e senha.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await loginAgendaUser(username, password);
      onSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="agenda-login-wrapper">
      <div className="agenda-login-card">
        <div className="agenda-login-header">
          <div className="agenda-login-icon">
            <Calendar size={28} />
          </div>
          <h2 className="agenda-login-title">Agenda Diária</h2>
          <p className="agenda-login-subtitle">Pastor Ezequias</p>
        </div>

        {errorMsg && (
          <div className="agenda-login-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="agenda-login-form">
          <div className="agenda-form-group">
            <label htmlFor="agenda-username">Usuário</label>
            <div className="agenda-input-wrapper">
              <User size={18} className="agenda-input-icon" />
              <input
                id="agenda-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu usuário da equipe"
                autoCapitalize="none"
                autoComplete="username"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="agenda-form-group">
            <label htmlFor="agenda-password">Senha</label>
            <div className="agenda-input-wrapper">
              <Lock size={18} className="agenda-input-icon" />
              <input
                id="agenda-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de acesso"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="agenda-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="agenda-btn-login"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Entrando...' : 'Entrar na Agenda'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="agenda-login-footer">
          <p>Acesso restrito à equipe autorizada.</p>
        </div>
      </div>
    </div>
  );
};
