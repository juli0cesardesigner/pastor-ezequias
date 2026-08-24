import React, { useState, useEffect } from 'react';
import type { Visita, VisitaInput, VisitStatus } from '../../types/visitas';
import { ES_MUNICIPALITIES, getCoordinatesForCity } from '../../services/visitasService';
import './VisitModal.css';

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visitaData: VisitaInput, editId?: number) => Promise<void>;
  initialData?: Partial<Visita> | null;
  clickedCoords?: { lat: number; lng: number; suggestedCity: string } | null;
}

export const VisitModal: React.FC<VisitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  clickedCoords,
}) => {
  const [city, setCity] = useState('');
  const [contactName, setContactName] = useState('');
  const [status, setStatus] = useState<VisitStatus>('pendente');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [lat, setLat] = useState<number>(-20.3155);
  const [lng, setLng] = useState<number>(-40.3128);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza formulário com dados iniciais ou clique no mapa
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    if (initialData && initialData.id) {
      // Modo Edição
      setCity(initialData.city || '');
      setContactName(initialData.contactName || '');
      setStatus(initialData.status || 'pendente');
      setPhone(initialData.phone || '');
      setRole(initialData.role || '');
      setAddress(initialData.address || '');
      setNotes(initialData.notes || '');
      setVisitDate(initialData.visitDate || '');
      setLat(initialData.latitude || -20.3155);
      setLng(initialData.longitude || -40.3128);
    } else if (clickedCoords) {
      // Modo Novo Registro via Clique no Mapa
      setCity(clickedCoords.suggestedCity);
      setContactName('');
      setStatus('pendente');
      setPhone('');
      setRole('');
      setAddress('');
      setNotes('');
      setVisitDate('');
      setLat(clickedCoords.lat);
      setLng(clickedCoords.lng);
    } else {
      // Modo Novo Registro Padrão
      setCity('Vitória');
      setContactName('');
      setStatus('pendente');
      setPhone('');
      setRole('');
      setAddress('');
      setNotes('');
      setVisitDate('');
      const coords = getCoordinatesForCity('Vitória');
      setLat(coords.lat);
      setLng(coords.lng);
    }
  }, [isOpen, initialData, clickedCoords]);

  // Atualiza coordenadas ao trocar de cidade no seletor
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    const coords = getCoordinatesForCity(newCity);
    setLat(coords.lat);
    setLng(coords.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setErrorMsg('Por favor, informe o nome do contato ou liderança.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Por favor, selecione um município do Espírito Santo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSave(
        {
          city: city.trim(),
          contactName: contactName.trim(),
          status,
          phone: phone.trim() || undefined,
          role: role.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          visitDate: visitDate.trim() || undefined,
          latitude: Number(lat),
          longitude: Number(lng),
        },
        initialData?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar visita. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = Boolean(initialData && initialData.id);

  return (
    <div className="visit-modal-overlay" onClick={onClose}>
      <div className="visit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="visit-modal-header">
          <div className="header-title-badge">
            <span className="modal-icon">{isEditing ? '✏️' : '📍'}</span>
            <h3>{isEditing ? 'Editar Visita' : 'Registrar Nova Visita'}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="visit-modal-form">
          {errorMsg && <div className="modal-error-alert">{errorMsg}</div>}

          {/* Status Selector (Segmented Control) */}
          <div className="form-group status-segmented-group">
            <label className="form-label">Status da Visita *</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn btn-pendente ${status === 'pendente' ? 'active' : ''}`}
                onClick={() => setStatus('pendente')}
              >
                <span className="dot dot-orange"></span>
                ⏳ Não Visitado (Pendente)
              </button>
              <button
                type="button"
                className={`segmented-btn btn-visitado ${status === 'visitado' ? 'active' : ''}`}
                onClick={() => setStatus('visitado')}
              >
                <span className="dot dot-green"></span>
                ✓ Já Visitado (Concluído)
              </button>
            </div>
          </div>

          <div className="form-row">
            {/* Nome do Contato / Liderança */}
            <div className="form-group flex-2">
              <label className="form-label">Nome do Contato / Liderança *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Pr. Marcos Silva, Irmã Eunice, Líder João"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Cidade / Município do ES */}
            <div className="form-group flex-1">
              <label className="form-label">Município do ES *</label>
              <select
                className="form-select"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                required
              >
                {ES_MUNICIPALITIES.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.region})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            {/* Telefone / WhatsApp */}
            <div className="form-group flex-1">
              <label className="form-label">
                WhatsApp / Telefone <span className="label-optional">(Opcional)</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="Ex: (27) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Cargo / Papel */}
            <div className="form-group flex-1">
              <label className="form-label">
                Cargo / Papel <span className="label-optional">(Opcional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Pastor Titular, Coordenador, Apoiador"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            {/* Data da Visita */}
            <div className="form-group flex-1">
              <label className="form-label">
                Data Prevista / Realizada <span className="label-optional">(Opcional)</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
          </div>

          {/* Endereço / Bairro */}
          <div className="form-group">
            <label className="form-label">
              Bairro / Endereço / Ponto de Referência <span className="label-optional">(Opcional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Bairro Jardim Camburi, próx. à Igreja Central"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Observações / Pauta */}
          <div className="form-group">
            <label className="form-label">
              Observações / Pauta da Visita <span className="label-optional">(Opcional)</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Ex: Alinhamento de agenda da caravana, reunião com obreiros, demandas do bairro..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="visit-modal-footer">
            <button
              type="button"
              className="modal-btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Visita' : 'Salvar no Mapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
