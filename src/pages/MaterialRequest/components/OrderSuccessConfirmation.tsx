import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const OrderSuccessConfirmation: React.FC = () => {
  return (
    <div className="order-success-screen animate-fade-in">
      <div className="success-icon-wrap">
        <CheckCircle2 size={54} className="icon-success-gold" />
      </div>

      <h2 className="success-main-title">Pedido Registrado com Sucesso!</h2>
      
      <p className="success-message">
        Recebemos sua solicitação de materiais. Agradecemos imensamente pelo seu apoio e engajamento!
      </p>
    </div>
  );
};
