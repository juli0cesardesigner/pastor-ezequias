import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, MessageCircle, MapPin, Package, FileText } from 'lucide-react';
import { STATUS_LABELS } from '../../../config/materials';
import type { MaterialRequestRecord, MaterialRequestStatus } from '../../../types/materials';

interface AdminRequestRowProps {
  request: MaterialRequestRecord;
  onStatusChange: (id: number, status: MaterialRequestStatus) => void;
}

export const AdminRequestRow: React.FC<AdminRequestRowProps> = ({
  request,
  onStatusChange
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    const itemsText = request.items_json.map((i) => `• ${i.quantity}x ${i.name}`).join('\n');
    const fullText = 
      `📦 *PEDIDO #${request.id} - ${new Date(request.created_at).toLocaleDateString('pt-BR')}*\n` +
      `👤 *Apoiador:* ${request.supporter_name}\n` +
      `📱 *WhatsApp:* ${request.whatsapp}\n\n` +
      `📍 *ENDEREÇO DE ENTREGA:*\n` +
      `${request.street}, Nº ${request.number}${request.complement ? ' - ' + request.complement : ''}\n` +
      `${request.neighborhood} - ${request.city}/${request.state} • CEP: ${request.cep}\n` +
      (request.reference_point ? `Ponto de Ref: ${request.reference_point}\n` : '') +
      `\n🏷️ *ITENS SOLICITADOS:*\n${itemsText}` +
      (request.notes ? `\n\n📝 *OBSERVAÇÕES:* ${request.notes}` : '');

    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      console.warn('Falha ao copiar para área de transferência');
    }
  };

  return (
    <div className={`admin-order-item ${isExpanded ? 'is-expanded' : ''}`}>
      {/* Main Bar: ID, Data, Nome, Status, Botão Copiar, Botão Detalhes */}
      <div className="admin-order-main-bar">
        <div className="order-main-id">#{request.id}</div>
        
        <div className="order-main-date">
          {new Date(request.created_at).toLocaleDateString('pt-BR')}
        </div>

        <div className="order-main-name" title={request.supporter_name}>
          {request.supporter_name}
        </div>

        <div className="order-main-status">
          <select
            className={`status-badge-select ${STATUS_LABELS[request.status]?.colorClass || ''}`}
            value={request.status}
            onChange={(e) => onStatusChange(request.id, e.target.value as MaterialRequestStatus)}
          >
            <option value="pendente">Pendente</option>
            <option value="separando">Em Separação</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="order-main-actions">
          <button
            type="button"
            className={`btn-action-icon copy ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copiar dados formatados"
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            className={`btn-action-icon details ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title="Ver detalhes do pedido"
          >
            <span>Detalhes</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Box */}
      {isExpanded && (
        <div className="admin-order-details-box animate-fade-in">
          <div className="details-grid">
            {/* Contato */}
            <div className="details-col">
              <span className="details-label">
                <MessageCircle size={14} className="text-gold" />
                Contato:
              </span>
              <div className="details-contact-row">
                <span className="details-val">{request.whatsapp}</span>
                <a
                  href={`https://wa.me/${request.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${request.supporter_name}, tudo bem? Aqui é da equipe do Pastor Ezequias sobre seu pedido de materiais #${request.id}!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-chat"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle size={13} />
                  <span>Conversar</span>
                </a>
              </div>
            </div>

            {/* Endereço */}
            <div className="details-col">
              <span className="details-label">
                <MapPin size={14} className="text-gold" />
                Endereço de Entrega:
              </span>
              <p className="details-val">
                {request.street}, Nº {request.number}{request.complement ? ` (${request.complement})` : ''}
              </p>
              <p className="details-val-sub">
                {request.neighborhood} • {request.city}/{request.state} • CEP {request.cep}
              </p>
              {request.reference_point && (
                <p className="details-val-ref">Ref: {request.reference_point}</p>
              )}
            </div>

            {/* Itens Solicitados */}
            <div className="details-col full">
              <span className="details-label">
                <Package size={14} className="text-gold" />
                Itens Solicitados:
              </span>
              <div className="details-items-chips">
                {request.items_json.map((item, idx) => (
                  <span key={idx} className="details-chip">
                    <strong>{item.quantity}x</strong> {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Observações */}
            {request.notes && (
              <div className="details-col full">
                <span className="details-label">
                  <FileText size={14} className="text-gold" />
                  Observações:
                </span>
                <p className="details-notes-text">{request.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
