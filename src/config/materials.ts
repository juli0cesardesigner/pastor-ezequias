import type { MaterialCatalogItem, MaterialRequestStatus } from '../types/materials';

export const DEFAULT_MATERIALS_CATALOG: MaterialCatalogItem[] = [
  {
    id: 'adesivo_carro',
    name: 'Adesivo de Carro / Parachoque',
    description: 'Adesivo vinílico de alta durabilidade, resistente ao sol e à chuva.',
    badgeText: 'Mais Pedido',
    hasLimit: true,
    maxQuantity: 5,
    isActive: true,
    displayOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'praguinha',
    name: 'Praguinha / Adesivo de Peito',
    description: 'Adesivo circular para demonstrar seu apoio com orgulho no peito.',
    badgeText: 'Popular',
    hasLimit: true,
    maxQuantity: 30,
    isActive: true,
    displayOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'santinhos',
    name: 'Santinhos / Panfletos Informativos',
    description: 'Material com trajetória, projetos e informações para compartilhar.',
    badgeText: 'Divulgação',
    hasLimit: true,
    maxQuantity: 100,
    isActive: true,
    displayOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cartaz_perfurado',
    name: 'Perfurado para Vidro Traseiro',
    description: 'Película especial perfurada com visibilidade interna de 100%.',
    badgeText: 'Destaque',
    hasLimit: true,
    maxQuantity: 2,
    isActive: true,
    displayOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80'
  }
];

export const STATUS_LABELS: Record<MaterialRequestStatus, { label: string; colorClass: string }> = {
  pendente: { label: 'Pendente', colorClass: 'status-pending' },
  separando: { label: 'Em Separação', colorClass: 'status-processing' },
  enviado: { label: 'Enviado / Em Trânsito', colorClass: 'status-shipped' },
  entregue: { label: 'Entregue', colorClass: 'status-delivered' },
  cancelado: { label: 'Cancelado', colorClass: 'status-cancelled' }
};

export const DEFAULT_WHATSAPP_NUMBER = '5527999999999';
