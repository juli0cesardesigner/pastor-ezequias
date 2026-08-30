import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  ExternalLink,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAllAgendaUsers,
  createAgendaUser,
  updateAgendaUser,
  toggleAgendaUserActive,
  deleteAgendaUser,
} from '../../../services/agendaService';
import type { AgendaUser, AgendaUserInput } from '../../../types/agenda';

export const AdminAgendaUsersTab: React.FC = () => {
  const [users, setUsers] = useState<AgendaUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgendaUser | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Equipe');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllAgendaUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setFeedback({ type: 'error', text: 'Não foi possível carregar a lista de usuários.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('Equipe');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AgendaUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(''); // Senha vazia para não alterar caso não queira
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      showFeedback('error', 'Nome e Usuário são obrigatórios.');
      return;
    }

    if (!editingUser && !formPassword.trim()) {
      showFeedback('error', 'A senha é obrigatória para novo usuário.');
      return;
    }

    setIsSaving(true);
    try {
      const input: AgendaUserInput = {
        name: formName.trim(),
        username: formUsername.trim(),
        password: formPassword.trim() || undefined,
        role: formRole.trim(),
        isActive: formIsActive,
      };

      if (editingUser) {
        await updateAgendaUser(editingUser.id, input);
        showFeedback('success', `Usuário "${input.name}" atualizado com sucesso!`);
      } else {
        await createAgendaUser(input);
        showFeedback('success', `Novo usuário "${input.name}" criado com sucesso!`);
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao salvar usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: AgendaUser) => {
    try {
      const nextActive = !user.isActive;
      await toggleAgendaUserActive(user.id, nextActive);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: nextActive } : u)));
      showFeedback(
        'success',
        `Acesso de "${user.name}" ${nextActive ? 'ativado' : 'desativado'}.`
      );
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao alterar status do usuário.');
    }
  };

  const handleDelete = async (user: AgendaUser) => {
    if (users.length <= 1) {
      showFeedback('error', 'Não é possível excluir o único usuário do sistema.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}" (@${user.username})?`)) {
      try {
        await deleteAgendaUser(user.id);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showFeedback('success', `Usuário "${user.name}" excluído com sucesso.`);
      } catch (err: any) {
        showFeedback('error', err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  const handleOpenAgendaDirectly = () => {
    window.location.href = '/agenda';
  };

  return (
    <div className="admin-agenda-users-tab">
      {/* Top Banner & Ações */}
      <div className="agenda-users-header">
        <div className="header-info">
          <div className="header-title-badge">
            <Shield size={18} className="text-gold" />
            <h2>Equipe & Acessos da Agenda</h2>
          </div>
          <p>
            Cadastre os membros da comitiva e coordenação para que possam acessar a Agenda Diária,
            visualizar rotas e cadastrar compromissos.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-open-agenda"
            onClick={handleOpenAgendaDirectly}
            title="Abrir a Agenda Diária em nova aba"
          >
            <Calendar size={16} />
            <span>Abrir Agenda Diária</span>
            <ExternalLink size={14} />
          </button>

          <button
            type="button"
            className="btn-create-user"
            onClick={handleOpenCreateModal}
          >
            <UserPlus size={16} />
            <span>Novo Membro da Equipe</span>
          </button>

          <button
            type="button"
            className="btn-admin-refresh"
            onClick={loadUsers}
            disabled={isLoading}
            title="Recarregar usuários"
          >
            <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`admin-toast-feedback ${feedback.type}`}>
          <AlertCircle size={16} />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="agenda-users-table-container">
        {users.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={36} className="text-gold opacity-50" />
            <p>Nenhum usuário cadastrado. Clique no botão acima para adicionar o primeiro membro.</p>
          </div>
        ) : (
          <table className="agenda-users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário / Login</th>
                <th>Função</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'user-inactive' : ''}>
                  <td>
                    <div className="user-name-cell">
                      <span className="user-avatar-initial">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong className="user-name-text">{user.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="user-login-badge">@{user.username}</code>
                  </td>
                  <td>
                    <span className="user-role-badge">{user.role}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`btn-toggle-status ${user.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(user)}
                      title="Clique para alternar o status de acesso"
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span>Inativo</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="user-actions-btns">
                      <button
                        type="button"
                        className="btn-user-action edit"
                        onClick={() => handleOpenEditModal(user)}
                        title="Editar dados e senha"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-user-action delete"
                        onClick={() => handleDelete(user)}
                        title="Excluir usuário"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Criação / Edição de Usuário */}
      {isModalOpen && (
        <div className="agenda-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="agenda-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="agenda-modal-header">
              <div className="agenda-modal-title-wrap">
                <Shield className="text-gold" size={20} />
                <h3>{editingUser ? 'Editar Usuário da Equipe' : 'Cadastrar Membro da Equipe'}</h3>
              </div>
              <button
                type="button"
                className="agenda-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="agenda-modal-form">
              <div className="agenda-form-group">
                <label htmlFor="user-name">Nome Completo *</label>
                <input
                  id="user-name"
                  type="text"
                  placeholder="Ex: Carlos Assessor, Pastor Ezequias..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="agenda-form-group">
                <label htmlFor="user-login">Usuário / Login * (sem espaços)</label>
                <input
                  id="user-login"
                  type="text"
                  placeholder="Ex: carlos, assessor1, pastor..."
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  required
                />
              </div>

              <div className="agenda-form-group">
                <label htmlFor="user-password">
                  <Key size={14} />
                  {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso *'}
                </label>
                <input
                  id="user-password"
                  type="text"
                  placeholder={editingUser ? '••••••••' : 'Senha para o membro acessar'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required={!editingUser}
                />
              </div>

              <div className="agenda-form-row">
                <div className="agenda-form-group flex-1">
                  <label htmlFor="user-role">Função / Cargo na Campanha</label>
                  <select
                    id="user-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    <option value="Coordenação">Coordenação Geral</option>
                    <option value="Pastor">Pastor Ezequias</option>
                    <option value="Assessor">Assessor Parlamentar / Político</option>
                    <option value="Logística & Caravana">Logística & Caravana</option>
                    <option value="Comunicação">Comunicação & Mídia</option>
                    <option value="Equipe">Equipe Geral</option>
                  </select>
                </div>

                <div className="agenda-form-group flex-1">
                  <label htmlFor="user-active">Status de Acesso</label>
                  <select
                    id="user-active"
                    value={formIsActive ? 'ativo' : 'inativo'}
                    onChange={(e) => setFormIsActive(e.target.value === 'ativo')}
                  >
                    <option value="ativo">✅ Ativo (Pode acessar)</option>
                    <option value="inativo">⛔ Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="agenda-modal-actions">
                <button
                  type="button"
                  className="btn-agenda-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-agenda-save"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : editingUser ? 'Atualizar Membro' : 'Criar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
