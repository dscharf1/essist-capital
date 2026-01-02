import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Lock,
  Unlock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  Loader2,
} from "lucide-react";

interface CardAllocation {
  id: string;
  application_id: string;
  card_number_masked: string;
  total_amount: number;
  materials_amount: number;
  labor_amount: number;
  materials_unlocked: boolean;
  labor_unlocked: boolean;
  merchant_category_lock: string[];
  created_at: string;
  applicant_name?: string;
  applicant_email?: string;
}

const AdminCards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    const { data: cardData } = await supabase
      .from("card_allocations")
      .select("*")
      .order("created_at", { ascending: false });

    if (cardData) {
      // Get application details
      const { data: apps } = await supabase
        .from("loan_applications")
        .select("id, first_name, last_name, email");

      const cardsWithDetails = cardData.map((card) => {
        const app = apps?.find((a) => a.id === card.application_id);
        return {
          ...card,
          applicant_name: app ? `${app.first_name} ${app.last_name}` : "Unknown",
          applicant_email: app?.email || "",
        };
      });

      setCards(cardsWithDetails);
    }
    setIsLoading(false);
  };

  const toggleLaborFunds = async (cardId: string, currentState: boolean) => {
    setProcessingId(cardId);
    try {
      const { error } = await supabase
        .from("card_allocations")
        .update({ labor_unlocked: !currentState })
        .eq("id", cardId);

      if (error) throw error;

      toast({
        title: currentState ? "Labor Funds Locked" : "Labor Funds Unlocked",
        description: currentState
          ? "The contractor's labor funds have been locked."
          : "The contractor's labor funds are now available.",
      });

      loadCards();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update card status",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const toggleMaterialsFunds = async (cardId: string, currentState: boolean) => {
    setProcessingId(cardId);
    try {
      const { error } = await supabase
        .from("card_allocations")
        .update({ materials_unlocked: !currentState })
        .eq("id", cardId);

      if (error) throw error;

      toast({
        title: currentState ? "Materials Funds Locked" : "Materials Funds Unlocked",
        description: currentState
          ? "The materials funds have been locked."
          : "The materials funds are now available.",
      });

      loadCards();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update card status",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const totalFundsAvailable = cards.reduce((sum, card) => {
    let available = 0;
    if (card.materials_unlocked) available += Number(card.materials_amount);
    if (card.labor_unlocked) available += Number(card.labor_amount);
    return sum + available;
  }, 0);

  const totalFundsLocked = cards.reduce((sum, card) => {
    let locked = 0;
    if (!card.materials_unlocked) locked += Number(card.materials_amount);
    if (!card.labor_unlocked) locked += Number(card.labor_amount);
    return sum + locked;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Card Management</h1>
        <p className="text-muted-foreground">Enable/disable card funds and merchant locks</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Active Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{cards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Unlock className="w-4 h-4 text-green-500" />
              Available Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${totalFundsAvailable.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Locked Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              ${totalFundsLocked.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Allocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${(totalFundsAvailable + totalFundsLocked).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            {/* Card Visual */}
            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground">
              <div className="flex items-center justify-between mb-8">
                <CreditCard className="w-10 h-10" />
                <span className="text-sm opacity-80">Project Card</span>
              </div>
              <p className="text-xl font-mono tracking-wider mb-2">
                {card.card_number_masked}
              </p>
              <p className="text-sm opacity-80">{card.applicant_name}</p>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Materials Fund */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      card.materials_unlocked
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                    }`}
                  >
                    {card.materials_unlocked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Materials</p>
                    <p className="text-lg font-bold">
                      ${Number(card.materials_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={card.materials_unlocked}
                  onCheckedChange={() =>
                    toggleMaterialsFunds(card.id, card.materials_unlocked)
                  }
                  disabled={processingId === card.id}
                />
              </div>

              {/* Labor Fund */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      card.labor_unlocked
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                    }`}
                  >
                    {card.labor_unlocked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Labor</p>
                    <p className="text-lg font-bold">
                      ${Number(card.labor_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={card.labor_unlocked}
                  onCheckedChange={() => toggleLaborFunds(card.id, card.labor_unlocked)}
                  disabled={processingId === card.id}
                />
              </div>

              {/* Merchant Lock */}
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  Merchant Category Lock
                </p>
                <div className="flex flex-wrap gap-1">
                  {card.merchant_category_lock?.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Card Status</span>
                {card.materials_unlocked || card.labor_unlocked ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Frozen
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cards.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No cards provisioned yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCards;
