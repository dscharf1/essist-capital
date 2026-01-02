import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useWorkflow } from "@/hooks/useWorkflow";
import {
  CheckCircle2,
  Circle,
  FileSignature,
  CreditCard,
  Hammer,
  ClipboardCheck,
  Wallet,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";

const statusSteps = [
  { key: "submitted", label: "Application Submitted", icon: Circle },
  { key: "document_sent", label: "Document Sent", icon: FileSignature },
  { key: "document_signed", label: "Document Signed", icon: FileSignature },
  { key: "card_provisioned", label: "Card Provisioned", icon: CreditCard },
  { key: "project_started", label: "Project Started", icon: Hammer },
  { key: "inspection_pending", label: "Inspection Scheduled", icon: ClipboardCheck },
  { key: "inspection_passed", label: "Inspection Passed", icon: ClipboardCheck },
  { key: "funds_released", label: "All Funds Released", icon: Wallet },
];

const ApplicationStatus = () => {
  const { id } = useParams<{ id: string }>();
  const {
    getStatus,
    signDocument,
    startProject,
    requestInspection,
    completeInspection,
    isLoading,
    currentStatus,
    cardInfo,
  } = useWorkflow();

  const [applicationData, setApplicationData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadStatus();
    }
  }, [id]);

  const loadStatus = async () => {
    if (!id) return;
    const result = await getStatus(id);
    setApplicationData(result.application);
    setEvents(result.events || []);
  };

  const handleAction = async (action: string) => {
    if (!id) return;

    try {
      switch (action) {
        case "sign":
          await signDocument(id);
          break;
        case "start":
          await startProject(id);
          break;
        case "request_inspection":
          await requestInspection(id);
          break;
        case "complete_inspection":
          await completeInspection(id, true);
          break;
      }
      await loadStatus();
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  const getCurrentStepIndex = () => {
    const status = currentStatus || applicationData?.status;
    return statusSteps.findIndex((s) => s.key === status);
  };

  const getNextAction = () => {
    const status = currentStatus || applicationData?.status;
    switch (status) {
      case "document_sent":
        return { label: "Sign Document", action: "sign" };
      case "document_signed":
      case "card_provisioned":
        return { label: "Start Project", action: "start" };
      case "project_started":
        return { label: "Request Inspection", action: "request_inspection" };
      case "inspection_pending":
        return { label: "Complete Inspection", action: "complete_inspection" };
      default:
        return null;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const nextAction = getNextAction();

  if (!applicationData && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
            <p className="text-muted-foreground">
              The application you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-2">Application Status</h1>
              <p className="text-muted-foreground">
                Track your loan application progress
              </p>
              {applicationData && (
                <p className="text-sm text-muted-foreground mt-2">
                  Application ID: {id}
                </p>
              )}
            </div>

            {isLoading && !applicationData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Progress Timeline */}
                <div className="lg:col-span-2">
                  <div className="bg-card rounded-3xl p-8 shadow-card">
                    <h2 className="text-xl font-semibold mb-6">Workflow Progress</h2>
                    <div className="space-y-1">
                      {statusSteps.map((step, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const Icon = step.icon;

                        return (
                          <div key={step.key} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? "bg-primary text-primary-foreground"
                                    : isCurrent
                                    ? "bg-primary/20 text-primary border-2 border-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <Icon className="w-5 h-5" />
                                )}
                              </div>
                              {idx < statusSteps.length - 1 && (
                                <div
                                  className={`w-0.5 h-12 ${
                                    isCompleted ? "bg-primary" : "bg-muted"
                                  }`}
                                />
                              )}
                            </div>
                            <div className="pb-8">
                              <p
                                className={`font-medium ${
                                  isCurrent ? "text-primary" : isCompleted ? "" : "text-muted-foreground"
                                }`}
                              >
                                {step.label}
                              </p>
                              {isCurrent && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Current step
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {nextAction && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <Button
                          onClick={() => handleAction(nextAction.action)}
                          disabled={isLoading}
                          size="lg"
                          className="w-full"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            nextAction.label
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Click to simulate the next workflow step
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Info */}
                <div className="space-y-6">
                  {(cardInfo || currentStepIndex >= 3) && (
                    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-card">
                      <div className="flex items-center justify-between mb-6">
                        <CreditCard className="w-10 h-10" />
                        <span className="text-sm opacity-80">Project Card</span>
                      </div>
                      <p className="text-xl font-mono mb-6">
                        {cardInfo?.cardNumber || "****-****-****-0000"}
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cardInfo?.materialsUnlocked ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span className="text-sm">Materials</span>
                          </div>
                          <span className="font-semibold">
                            ${(cardInfo?.materialsAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {cardInfo?.laborUnlocked ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span className="text-sm">Labor</span>
                          </div>
                          <span className="font-semibold">
                            ${(cardInfo?.laborAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!cardInfo?.laborUnlocked && (
                        <p className="text-xs mt-4 opacity-80">
                          Labor funds unlock after inspection approval
                        </p>
                      )}
                    </div>
                  )}

                  {/* Application Details */}
                  {applicationData && (
                    <div className="bg-card rounded-3xl p-6 shadow-card">
                      <h3 className="font-semibold mb-4">Application Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Applicant</span>
                          <span className="font-medium">
                            {applicationData.first_name} {applicationData.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Project</span>
                          <span className="font-medium">{applicationData.project_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium">
                            ${Number(applicationData.requested_amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium capitalize">
                            {(currentStatus || applicationData.status).replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Log */}
                  {events.length > 0 && (
                    <div className="bg-card rounded-3xl p-6 shadow-card">
                      <h3 className="font-semibold mb-4">Activity Log</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {events.map((event, idx) => (
                          <div
                            key={idx}
                            className="text-xs border-l-2 border-primary/30 pl-3"
                          >
                            <p className="font-medium capitalize">
                              {event.event_type.replace(/_/g, " ")}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(event.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApplicationStatus;
