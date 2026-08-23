import type { ViaCepResponse } from '../types/materials';

export interface AddressLookupResult {
  success: boolean;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  error?: string;
}

export async function fetchAddressByCep(cep: string): Promise<AddressLookupResult> {
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return { success: false, error: 'CEP deve conter 8 dígitos' };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Erro na consulta do CEP: status ${response.status}`);
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return { success: false, error: 'CEP não encontrado' };
    }

    return {
      success: true,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao buscar CEP'
    };
  }
}
