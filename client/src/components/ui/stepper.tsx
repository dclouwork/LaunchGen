import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Stepper({ 
  steps, 
  currentStep, 
  className,
  orientation = "horizontal" 
}: StepperProps) {
  return (
    <div 
      className={cn(
        "relative w-full",
        orientation === "vertical" ? "flex flex-col space-y-4" : 
        "flex items-center justify-between flex-wrap sm:flex-nowrap",
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isPending = currentStep < step.id;
        
        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center relative",
              orientation === "vertical" ? "w-full" : "flex-1 min-w-[150px] sm:min-w-0",
              index !== steps.length - 1 && orientation === "horizontal" && "pr-4 sm:pr-8 md:pr-12",
              // Mobile grid layout
              orientation === "horizontal" && "basis-1/2 sm:basis-auto"
            )}
          >
            {/* Step circle and content */}
            <div className={cn(
              "flex",
              orientation === "vertical" ? "items-start space-x-4 w-full" : "flex-col items-center"
            )}>
              {/* Circle */}
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-in-out",
                    isCompleted && "bg-primary border-primary sm:scale-110",
                    isActive && "border-primary bg-background shadow-lg sm:scale-110",
                    isPending && "border-muted-foreground/30 bg-background"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-primary-foreground animate-in fade-in-50 zoom-in-50 duration-300" />
                  ) : (
                    <span 
                      className={cn(
                        "text-sm font-medium transition-colors duration-200",
                        isActive && "text-primary",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </div>
                
                {/* Progress line - hide on mobile for better layout */}
                {index !== steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute bg-muted-foreground/20 transition-all duration-300 ease-out",
                      orientation === "vertical" 
                        ? "top-10 left-5 w-0.5 h-16" 
                        : "left-10 top-5 h-0.5 w-full hidden sm:block",
                      orientation === "horizontal" && "sm:w-[calc(100%-2.5rem)]"
                    )}
                  >
                    <div 
                      className={cn(
                        "h-full bg-primary transition-all duration-500 ease-out",
                        isCompleted ? "w-full" : "w-0"
                      )}
                      style={{
                        width: orientation === "horizontal" && isCompleted ? "100%" : 
                               orientation === "vertical" && isCompleted ? "100%" : "0%",
                        height: orientation === "vertical" && isCompleted ? "100%" : "100%"
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Label */}
              <div className={cn(
                orientation === "vertical" ? "flex-1" : "mt-2 sm:mt-3 text-center",
                "transition-all duration-200"
              )}>
                <p 
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-colors duration-200 px-1",
                    isActive && "text-foreground font-semibold",
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && orientation === "vertical" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Progress percentage display component
export function StepperProgress({ 
  currentStep, 
  totalSteps,
  className 
}: { 
  currentStep: number; 
  totalSteps: number;
  className?: string;
}) {
  const percentage = Math.round((currentStep - 1) / totalSteps * 100);
  
  return (
    <div className={cn("text-center", className)}>
      <p className="text-sm font-medium text-muted-foreground">
        {percentage}% complete
      </p>
    </div>
  );
}