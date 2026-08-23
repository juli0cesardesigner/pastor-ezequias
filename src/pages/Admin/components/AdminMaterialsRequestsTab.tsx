import React from 'react';
import { Download, Search, Package } from 'lucide-react';
import { AdminRequestRow } from './AdminRequestRow';
import type { MaterialRequestRecord, MaterialRequestStatus } from '../../../types/materials';

interface AdminMaterialsRequestsTabProps {
  requests: MaterialRequestRecord[];
  statusFilter: string;
  searchTerm: string;
  onStatusFilterChange: (status: string) => void;
  onSearchTermChange: (term: string) => void;
  onStatusChange: (id: number, status: MaterialRequestStatus) => void;
  onExportCSV: () => void;
}

export const AdminMaterialsRequestsTab: React.FC<AdminMaterialsRequestsTabProps> = ({
  requests,
  statusFilter,
  searchTerm,
  onStatusFilterChange,
  onSearchTermChange,
  onStatusChange,
  onExportCSV
}) => {
  return (
    <div className="admin-tab-content">
      {/* Controls Bar */}
      <div className="admin-controls-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar por nome, fone, cidade ou #ID..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>

        <div className="filter-actions-wrap">
          <select
            className="status-select-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="separando">Em Separação</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <button type="button" className="btn-export-csv" onClick={onExportCSV}>
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      {requests.length === 0 ? (
        <div className="requests-empty-flat">
          <Package size={36} />
          <p>Nenhum pedido de material encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {/* Header Row on Desktop */}
          <div className="admin-orders-header-row">
            <span className="col-header id">ID</span>
            <span className="col-header date">Data</span>
            <span className="col-header name">Nome</span>
            <span className="col-header status">Status</span>
            <span className="col-header actions">Ações</span>
          </div>

          {requests.map((req) => (
            <AdminRequestRow
              key={req.id}
              request={req}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
