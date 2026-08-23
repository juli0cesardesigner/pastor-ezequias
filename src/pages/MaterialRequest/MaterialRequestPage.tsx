import React from 'react';
import { useMaterialOrder } from '../../hooks/useMaterialOrder';
import { StepProgressBar } from './components/StepProgressBar';
import { Step1Materials } from './components/Step1Materials';
import { Step2Contact } from './components/Step2Contact';
import { Step3Address } from './components/Step3Address';
import { Step4Review } from './components/Step4Review';
import { OrderSuccessConfirmation } from './components/OrderSuccessConfirmation';
import './MaterialRequestPage.css';

export const MaterialRequestPage: React.FC = () => {
  const {
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
    selectedItems,
    totalItemCount,
    setSupporter,
    setAddress,
    handleQuantityChange,
    handleCepBlur,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit
  } = useMaterialOrder();

  if (successOrderId) {
    return (
      <div className="materials-wizard-container">
        <OrderSuccessConfirmation />
      </div>
    );
  }

  return (
    <div className="materials-wizard-container">
      <StepProgressBar currentStep={currentStep} onStepClick={goToStep} />

      <main className="materials-wizard-card">
        {currentStep === 1 && (
          <Step1Materials
            catalog={catalog}
            quantities={quantities}
            selectedItems={selectedItems}
            totalItemCount={totalItemCount}
            isLoading={isLoadingCatalog}
            stepError={stepError}
            onQuantityChange={handleQuantityChange}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <Step2Contact
            supporter={supporter}
            stepError={stepError}
            onChange={setSupporter}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}

        {currentStep === 3 && (
          <Step3Address
            address={address}
            isSearchingCep={isSearchingCep}
            stepError={stepError}
            onChange={setAddress}
            onCepBlur={handleCepBlur}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}

        {currentStep === 4 && (
          <Step4Review
            selectedItems={selectedItems}
            totalItemCount={totalItemCount}
            supporter={supporter}
            address={address}
            isSubmitting={isSubmitting}
            stepError={stepError}
            onGoToStep={goToStep}
            onPrev={prevStep}
            onSubmit={() => handleSubmit()}
          />
        )}
      </main>
    </div>
  );
};
