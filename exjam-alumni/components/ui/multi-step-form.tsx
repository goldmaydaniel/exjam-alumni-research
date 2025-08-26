"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";

interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<any>;
  validation?: () => Promise<boolean> | boolean;
}

interface MultiStepFormProps {
  steps: FormStep[];
  onComplete: (data: any) => void | Promise<void>;
  onStepChange?: (currentStep: number, totalSteps: number) => void;
  className?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  formData?: any;
  onFormDataChange?: (data: any) => void;
}

export function MultiStepForm({
  steps,
  onComplete,
  onStepChange,
  className = "",
  showProgress = true,
  allowSkip = false,
  formData = {},
  onFormDataChange,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStepData.validation) {
      setIsValidating(true);
      setValidationError(null);
      
      try {
        const isValid = await currentStepData.validation();
        if (!isValid) {
          setValidationError("Please fill in all required fields correctly.");
          setIsValidating(false);
          return;
        }
      } catch (error) {
        setValidationError("Validation failed. Please check your inputs.");
        setIsValidating(false);
        return;
      }
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (isLastStep) {
      // Complete the form
      try {
        await onComplete(formData);
      } catch (error) {
        setValidationError("Failed to submit form. Please try again.");
      }
    } else {
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep, steps.length);
    }

    setIsValidating(false);
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setValidationError(null);
      onStepChange?.(prevStep, steps.length);
    }
  };

  const handleSkip = () => {
    if (allowSkip && !isLastStep) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep, steps.length);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setValidationError(null);
      onStepChange?.(stepIndex, steps.length);
    }
  };

  const updateFormData = (stepData: any) => {
    const newFormData = { ...formData, ...stepData };
    onFormDataChange?.(newFormData);
  };

  const CurrentStepComponent = currentStepData.component;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Progress Header */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </h2>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          
          <Progress value={progress} className="h-2 mb-4" />
          
          {/* Step Indicators */}
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex-1 text-xs py-2 px-1 text-center transition-colors ${
                  index === currentStep
                    ? "text-blue-600 font-semibold"
                    : completedSteps.has(index)
                    ? "text-green-600"
                    : "text-gray-400"
                } ${index <= currentStep || completedSteps.has(index) ? "cursor-pointer hover:text-blue-700" : "cursor-not-allowed"}`}
                disabled={index > currentStep && !completedSteps.has(index)}
              >
                <div className="flex items-center justify-center mb-1">
                  {completedSteps.has(index) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="truncate">{step.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            {currentStepData.description && (
              <p className="text-gray-600">
                {currentStepData.description}
              </p>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{validationError}</p>
            </div>
          )}

          {/* Step Component */}
          <div className="mb-8">
            <CurrentStepComponent
              formData={formData}
              onDataChange={updateFormData}
              isActive={true}
              goToNext={handleNext}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="order-2 sm:order-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3 order-1 sm:order-2">
              {allowSkip && !isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={isValidating}
                className="flex-1 sm:flex-none min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLastStep ? "Submitting..." : "Validating..."}
                  </>
                ) : (
                  <>
                    {isLastStep ? "Complete" : "Continue"}
                    {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Friendly Step Summary */}
      <div className="mt-6 block sm:hidden">
        <div className="text-center text-sm text-gray-500">
          Swipe left/right or use buttons to navigate steps
        </div>
      </div>
    </div>
  );
}

// Helper hook for form steps
export function useMultiStepForm(initialData = {}) {
  const [formData, setFormData] = useState(initialData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateFormData = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData(initialData);
    setCurrentStep(0);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return {
    formData,
    currentStep,
    updateFormData,
    resetForm,
    goToStep,
    setCurrentStep,
  };
}