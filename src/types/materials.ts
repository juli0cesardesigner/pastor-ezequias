export type MaterialRequestStatus =
  | 'pendente'
  | 'separando'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export interface MaterialCatalogItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  badgeText?: string;
  hasLimit: boolean;
  maxQuantity: number;
  isActive: boolean;
  displayOrder: number;
}

export interface SelectedMaterialItem {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface SupporterInfo {
  name: string;
  whatsapp: string;
  notes?: string;
}

export interface DeliveryAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  referencePoint?: string;
}

export interface MaterialRequestPayload {
  supporter: SupporterInfo;
  address: DeliveryAddress;
  items: SelectedMaterialItem[];
}

export interface MaterialRequestRecord {
  id: number;
  supporter_name: string;
  whatsapp: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference_point?: string;
  items_json: SelectedMaterialItem[];
  notes?: string;
  status: MaterialRequestStatus;
  created_at: string;
  updated_at?: string;
}

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}
