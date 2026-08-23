import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { fetchMaterialsCatalog } from '../services/materialCatalogService';
import { createMaterialRequest, getWhatsAppDestination } from '../services/materialRequestService';
import { fetchAddressByCep } from '../services/viaCepService';
import type {
  MaterialCatalogItem,
  SelectedMaterialItem,
  SupporterInfo,
  DeliveryAddress
} from '../types/materials';

export type WizardStep = 1 | 2 | 3 | 4;

export function useMaterialOrder() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [catalog, setCatalog] = useState<MaterialCatalogItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [supporter, setSupporter] = useState<SupporterInfo>({ name: '', whatsapp: '', notes: '' });
  const [address, setAddress] = useState<DeliveryAddress>({
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', referencePoint: ''
  });

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    fetchMaterialsCatalog(true)
      .then((items) => {
        if (isMounted) {
          setCatalog(items);
          setIsLoadingCatalog(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingCatalog(false);
      });
    return () => { isMounted = false; };
  }, []);

  const handleQuantityChange = useCallback((id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const item = catalog.find((c) => c.id === id);
      const nextVal = current + delta;
      if (nextVal < 0) return prev;
      if (item && item.hasLimit && nextVal > item.maxQuantity) return prev;
      return { ...prev, [id]: nextVal };
    });
    setStepError(null);
  }, [catalog]);

  const handleCepBlur = useCallback(async () => {
    const cleanCep = address.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setIsSearchingCep(true);
    const res = await fetchAddressByCep(cleanCep);
    setIsSearchingCep(false);
    if (res.success) {
      setAddress((prev) => ({
        ...prev,
        street: res.street || prev.street,
        neighborhood: res.neighborhood || prev.neighborhood,
        city: res.city || prev.city,
        state: res.state || prev.state
      }));
      setStepError(null);
    }
  }, [address.cep]);

  const selectedItems: SelectedMaterialItem[] = useMemo(() => {
    return catalog
      .filter((item) => (quantities[item.id] || 0) > 0)
      .map((item) => ({
        id: item.id,
        name: item.name,
        quantity: quantities[item.id],
        imageUrl: item.imageUrl
      }));
  }, [catalog, quantities]);

  const totalItemCount = useMemo(() => {
    return selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [selectedItems]);

  const validateStep = useCallback((step: WizardStep): boolean => {
    setStepError(null);
    if (step === 1) {
      if (selectedItems.length === 0) {
        setStepError('Selecione ao menos 1 material para continuar.');
        return false;
      }
    }
    if (step === 2) {
      if (!supporter.name.trim()) {
        setStepError('Por favor, informe seu nome completo.');
        return false;
      }
      const rawPhone = supporter.whatsapp.replace(/\D/g, '');
      if (rawPhone.length < 10) {
        setStepError('Informe um WhatsApp válido com DDD.');
        return false;
      }
    }
    if (step === 3) {
      if (!address.cep || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
        setStepError('Preencha os campos obrigatórios do endereço de entrega.');
        return false;
      }
    }
    return true;
  }, [selectedItems, supporter, address]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev < 4 ? ((prev + 1) as WizardStep) : prev));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setStepError(null);
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setStepError(null);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsSubmitting(true);
    const result = await createMaterialRequest({ supporter, address, items: selectedItems });
    setIsSubmitting(false);

    if (!result.success || !result.id) {
      setStepError(result.error || 'Erro ao registrar solicitação. Tente novamente.');
      return;
    }

    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    setSuccessOrderId(result.id);

    const targetPhone = await getWhatsAppDestination();
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const itemsListText = selectedItems.map((i) => `• ${i.quantity}x ${i.name}`).join('\n');
    const msg = `*Novo Pedido de Material - Protocolo #${result.id}*\n\n` +
      `*Apoiador:* ${supporter.name}\n` +
      `*WhatsApp:* ${supporter.whatsapp}\n\n` +
      `*Itens Solicitados:*\n${itemsListText}\n\n` +
      `*Endereço de Entrega:*\n${address.street}, Nº ${address.number}${address.complement ? ' - ' + address.complement : ''}\n` +
      `${address.neighborhood} - ${address.city}/${address.state}\n` +
      `CEP: ${address.cep}\n` +
      (address.referencePoint ? `Ref: ${address.referencePoint}\n` : '') +
      (supporter.notes ? `\n*Obs:* ${supporter.notes}` : '');

    const encoded = encodeURIComponent(msg);
    const link = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    setWhatsappLink(link);
  }, [selectedItems, supporter, address, validateStep]);

  const resetOrder = useCallback(() => {
    setCurrentStep(1);
    setQuantities({});
    setSupporter({ name: '', whatsapp: '', notes: '' });
    setAddress({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', referencePoint: '' });
    setSuccessOrderId(null);
    setWhatsappLink('');
    setStepError(null);
  }, []);

  return {
    currentStep,
    catalog,
    quantities,
    supporter,
    address,
    isLoadingCatalog,
    isSearchingCep,
    isSubmitting,
    stepError,
    successOrderId,
    whatsappLink,
    selectedItems,
    totalItemCount,
    setSupporter,
    setAddress,
    handleQuantityChange,
    handleCepBlur,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    resetOrder
  };
}
