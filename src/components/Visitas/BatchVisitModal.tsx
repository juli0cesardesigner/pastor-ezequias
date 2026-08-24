import React, { useState } from 'react';
import type { VisitaInput, VisitStatus } from '../../types/visitas';
import { ES_MUNICIPALITIES, getCoordinatesForCity } from '../../services/visitasService';
import './BatchVisitModal.css';

interface BatchVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (visitasData: VisitaInput[]) => Promise<void>;
}

interface BatchRowItem {
  id: string;
  contactName: string;
  city: string;
  phone: string;
  role: string;
  address: string;
  notes: string;
  visitDate: string;
  status: VisitStatus;
}

const EXAMPLE_TEXT = `Pr. Carlos | Vitória | (27) 99999-1111 | Pastor Titular | Pendente | Igreja Central
Irmã Maria | Vila Velha | (27) 98888-2222 | Líder de Obreiras | Visitado | Bairro Glória
Pb. Marcos Silva | Serra | (27) 97777-3333 | Presbítero | Pendente | Jardim Limoeiro
Líder João | Cariacica | (27) 96666-4444 | Coordenador Regional | Pendente | Campo Grande
Pr. Roberto | Linhares | (27) 95555-5555 | Pastor Regional | Visitado | Centro`;

function createEmptyRow(): BatchRowItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
    contactName: '',
    city: 'Vitória',
    phone: '',
    role: '',
    address: '',
    notes: '',
    visitDate: '',
    status: 'pendente',
  };
}

/**
 * Reconhece se um texto corresponde a um dos municípios do ES
 */
function findMatchingESCity(text: string): string | null {
  const clean = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const m of ES_MUNICIPALITIES) {
    const mClean = m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (mClean === clean || mClean.includes(clean) || clean.includes(mClean)) {
      return m.name;
    }
  }
  return null;
}

/**
 * Parser inteligente de linhas de texto (separadas por tab, pipe, vírgula, ponto-e-vírgula ou hífen)
 */
function parseRawBatchText(rawText: string): BatchRowItem[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  const parsedRows: BatchRowItem[] = [];

  lines.forEach((line) => {
    // Detecta o melhor delimitador: tab, pipe, ponto-e-vírgula, vírgula ou hífen
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else if (line.includes(',') && (line.match(/,/g) || []).length >= 2) {
      parts = line.split(',');
    } else if (line.includes(' - ')) {
      parts = line.split(' - ');
    } else {
      parts = [line];
    }

    parts = parts.map((p) => p.trim());

    let contactName = '';
    let city = 'Vitória';
    let phone = '';
    let role = '';
    let status: VisitStatus = 'pendente';
    let address = '';
    let notes = '';
    let visitDate = '';

    if (parts.length === 1) {
      contactName = parts[0];
    } else {
      contactName = parts[0];

      // Analisa as demais partes inteligentemente
      const remaining = parts.slice(1);
      const usedIndices = new Set<number>();

      // 1. Procura se alguma parte é cidade do ES
      remaining.forEach((part, idx) => {
        if (usedIndices.has(idx)) return;
        const matchedCity = findMatchingESCity(part);
        if (matchedCity) {
          city = matchedCity;
          usedIndices.add(idx);
        }
      });

      // 2. Procura se alguma parte é status (visitado / pendente)
      remaining.forEach((part, idx) => {
        if (usedIndices.has(idx)) return;
        const lower = part.toLowerCase();
        if (['visitado', 'sim', 'concluido', 'ok', 'feito'].includes(lower)) {
          status = 'visitado';
          usedIndices.add(idx);
        } else if (['pendente', 'a visitar', 'nao', 'não', 'aguardando'].includes(lower)) {
          status = 'pendente';
          usedIndices.add(idx);
        }
      });

      // 3. Procura telefone (números)
      remaining.forEach((part, idx) => {
        if (usedIndices.has(idx)) return;
        const digits = part.replace(/\D/g, '');
        if (digits.length >= 8 && digits.length <= 13) {
          phone = part;
          usedIndices.add(idx);
        }
      });

      // 4. Procura data (YYYY-MM-DD ou DD/MM/YYYY)
      remaining.forEach((part, idx) => {
        if (usedIndices.has(idx)) return;
        if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
          visitDate = part;
          usedIndices.add(idx);
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(part)) {
          const [d, m, y] = part.split('/');
          visitDate = `${y}-${m}-${d}`;
          usedIndices.add(idx);
        }
      });

      // 5. Atribui o restante sequencialmente para Cargo, Endereço e Observações
      const unused = remaining.filter((_, idx) => !usedIndices.has(idx));
      if (unused.length > 0) role = unused[0];
      if (unused.length > 1) address = unused[1];
      if (unused.length > 2) notes = unused.slice(2).join(' - ');
    }

    if (contactName) {
      parsedRows.push({
        id: Math.random().toString(36).substring(2, 9),
        contactName,
        city,
        phone,
        role,
        address,
        notes,
        visitDate,
        status,
      });
    }
  });

  return parsedRows;
}

export const BatchVisitModal: React.FC<BatchVisitModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'table'>('text');
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<BatchRowItem[]>([createEmptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoadExample = () => {
    setRawText(EXAMPLE_TEXT);
  };

  const handleProcessText = () => {
    if (!rawText.trim()) {
      setErrorMsg('Por favor, cole ou digite as informações no campo de texto.');
      return;
    }

    const parsed = parseRawBatchText(rawText);
    if (parsed.length === 0) {
      setErrorMsg('Não foi possível identificar registros válidos no texto inserido.');
      return;
    }

    setRows(parsed);
    setActiveTab('table');
    setErrorMsg('');
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : [createEmptyRow()]));
  };

  const handleUpdateRow = (id: string, field: keyof BatchRowItem, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar todos os itens da tabela?')) {
      setRows([createEmptyRow()]);
      setRawText('');
      setErrorMsg('');
    }
  };

  const handleSaveAll = async () => {
    const validRows = rows.filter((r) => r.contactName.trim().length > 0);

    if (validRows.length === 0) {
      setErrorMsg('Informe pelo menos um nome de contato válido na tabela.');
      setActiveTab('table');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const inputs: VisitaInput[] = validRows.map((r) => {
        const coords = getCoordinatesForCity(r.city);
        return {
          contactName: r.contactName.trim(),
          city: r.city.trim(),
          status: r.status,
          phone: r.phone.trim() || undefined,
          role: r.role.trim() || undefined,
          address: r.address.trim() || undefined,
          notes: r.notes.trim() || undefined,
          visitDate: r.visitDate.trim() || undefined,
          latitude: coords.lat,
          longitude: coords.lng,
        };
      });

      await onSaveBatch(inputs);
      onClose();
      // Reset
      setRawText('');
      setRows([createEmptyRow()]);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao salvar as visitas em lote. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = rows.filter((r) => r.contactName.trim().length > 0).length;

  return (
    <div className="batch-modal-overlay" onClick={onClose}>
      <div className="batch-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="batch-modal-header">
          <div className="header-title-badge">
            <span className="modal-icon">📦</span>
            <div>
              <h3>Cadastro de Visitas em Lote</h3>
              <p className="modal-subtitle">Importe listas de contatos, igrejas e lideranças com 1 clique</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="batch-tab-bar">
          <button
            type="button"
            className={`batch-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            📋 Colar Texto / Planilha
          </button>
          <button
            type="button"
            className={`batch-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            📊 Revisar Tabela ({validCount})
          </button>
        </div>

        {errorMsg && <div className="batch-error-alert">{errorMsg}</div>}

        <div className="batch-modal-body">
          {/* Tab 1: Colar Texto */}
          {activeTab === 'text' && (
            <div className="batch-text-pane">
              <div className="text-pane-toolbar">
                <span className="toolbar-hint">
                  Cole linhas copiadas do <strong>Excel, WhatsApp, Bloco de Notas ou CSV</strong>:
                </span>
                <button type="button" className="btn-load-example" onClick={handleLoadExample}>
                  ✨ Carregar Exemplo
                </button>
              </div>

              <textarea
                className="batch-textarea"
                rows={10}
                placeholder={`Formato flexível (Nome | Cidade | Telefone | Cargo | Status | Obs):\n\nPr. Marcos Silva | Vitória | (27) 99999-8888 | Pastor | Pendente\nIrmã Eunice | Serra | 27988887777 | Coordenadora | Visitado\nLíder João | Vila Velha | 27977776666 | Apoiador`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              <div className="batch-text-footer">
                <button
                  type="button"
                  className="btn-process-text"
                  onClick={handleProcessText}
                >
                  ⚡ Processar e Revisar Dados ➔
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Tabela Interativa de Linhas */}
          {activeTab === 'table' && (
            <div className="batch-table-pane">
              <div className="table-actions-top">
                <button type="button" className="btn-add-table-row" onClick={handleAddRow}>
                  + Adicionar Linha
                </button>
                <button type="button" className="btn-clear-table" onClick={handleClearAll}>
                  🗑️ Limpar Tudo
                </button>
              </div>

              <div className="batch-table-container">
                <table className="batch-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th style={{ width: '130px' }}>Status</th>
                      <th style={{ minWidth: '180px' }}>Nome / Liderança *</th>
                      <th style={{ minWidth: '160px' }}>Município ES *</th>
                      <th style={{ minWidth: '130px' }}>WhatsApp / Tel</th>
                      <th style={{ minWidth: '140px' }}>Cargo / Papel</th>
                      <th style={{ minWidth: '130px' }}>Data Visita</th>
                      <th style={{ minWidth: '160px' }}>Bairro / Endereço</th>
                      <th style={{ minWidth: '160px' }}>Observações</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="row-num">{idx + 1}</td>
                        <td>
                          <select
                            className={`table-cell-select status-select ${row.status}`}
                            value={row.status}
                            onChange={(e) =>
                              handleUpdateRow(row.id, 'status', e.target.value as VisitStatus)
                            }
                          >
                            <option value="pendente">⏳ A Visitar</option>
                            <option value="visitado">✓ Visitado</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-cell-input"
                            placeholder="Nome do contato"
                            value={row.contactName}
                            onChange={(e) => handleUpdateRow(row.id, 'contactName', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <select
                            className="table-cell-select"
                            value={row.city}
                            onChange={(e) => handleUpdateRow(row.id, 'city', e.target.value)}
                          >
                            {ES_MUNICIPALITIES.map((m) => (
                              <option key={m.name} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-cell-input"
                            placeholder="(27) 99999-8888"
                            value={row.phone}
                            onChange={(e) => handleUpdateRow(row.id, 'phone', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-cell-input"
                            placeholder="Pastor, Obreiro..."
                            value={row.role}
                            onChange={(e) => handleUpdateRow(row.id, 'role', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="table-cell-input"
                            value={row.visitDate}
                            onChange={(e) => handleUpdateRow(row.id, 'visitDate', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-cell-input"
                            placeholder="Bairro ou endereço"
                            value={row.address}
                            onChange={(e) => handleUpdateRow(row.id, 'address', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="table-cell-input"
                            placeholder="Notas da visita"
                            value={row.notes}
                            onChange={(e) => handleUpdateRow(row.id, 'notes', e.target.value)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-remove-row"
                            onClick={() => handleRemoveRow(row.id)}
                            title="Remover linha"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="batch-modal-footer">
          <div className="footer-counter">
            <span>
              Total a cadastrar: <strong>{validCount} visita(s)</strong>
            </span>
          </div>

          <div className="footer-buttons">
            <button
              type="button"
              className="modal-btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="modal-btn btn-primary"
              onClick={handleSaveAll}
              disabled={isSubmitting || validCount === 0}
            >
              {isSubmitting
                ? 'Salvando no Neon DB...'
                : `Salvar ${validCount} Visita(s) no Mapa`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
