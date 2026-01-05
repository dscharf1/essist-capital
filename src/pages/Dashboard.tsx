import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Calendar,
  DollarSign,
  Activity,
  Loader2
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type LoanApplication = Database['public']['Tables']['loan_applications']['Row'];
type CardAllocation = Database['public']['Tables']['card_allocations']['Row'];
type WorkflowEvent = Database['public']['Tables']['workflow_events']['Row'];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  document_sent: { label: 'Documents Sent', color: 'bg-yellow-500/10 text-yellow-500', icon: FileText },
  document_signed: { label: 'Documents Signed', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  card_provisioned: { label: 'Card Ready', color: 'bg-primary/10 text-primary', icon: CreditCard },
  project_started: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500', icon: Activity },
  inspection_pending: { label: 'Inspection Pending', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  inspection_passed: { label: 'Inspection Passed', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  funds_released: { label: 'Funds Released', color: 'bg-green-500/10 text-green-500', icon: DollarSign },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: AlertCircle }
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [cards, setCards] = useState<CardAllocation[]>([]);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch user's applications
      const { data: appsData, error: appsError } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);

      // Fetch cards for user's applications
      if (appsData && appsData.length > 0) {
        const appIds = appsData.map(app => app.id);
        
        const { data: cardsData, error: cardsError } = await supabase
          .from('card_allocations')
          .select('*')
          .in('application_id', appIds);

        if (!cardsError) setCards(cardsData || []);

        // Fetch recent events
        const { data: eventsData, error: eventsError } = await supabase
          .from('workflow_events')
          .select('*')
          .in('application_id', appIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!eventsError) setEvents(eventsData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const activeApplications = applications.filter(app => 
    !['completed', 'rejected'].includes(app.status)
  );

  const totalFunded = cards.reduce((sum, card) => sum + Number(card.total_amount), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your home improvement financing and track your projects
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-3xl font-bold text-foreground">{activeApplications.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Funded</p>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(totalFunded)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cards</p>
                    <p className="text-3xl font-bold text-foreground">{cards.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
              <TabsTrigger value="cards">My Cards</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Your Applications</h2>
                <Button asChild>
                  <Link to="/apply">
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                  </Link>
                </Button>
              </div>

              {applications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your home improvement journey by applying for financing
                    </p>
                    <Button asChild>
                      <Link to="/apply">
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {applications.map((app) => {
                    const status = statusConfig[app.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card key={app.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/application/${app.id}`)}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <StatusIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{app.project_type}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(Number(app.requested_amount))} • Applied {formatDate(app.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={status.color}>{status.label}</Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Cards Tab */}
            <TabsContent value="cards" className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Your Cards</h2>

              {cards.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No cards yet</h3>
                    <p className="text-muted-foreground">
                      Cards are provisioned once your application is approved and documents are signed
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {cards.map((card) => {
                    const app = applications.find(a => a.id === card.application_id);
                    
                    return (
                      <Card key={card.id} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{app?.project_type || 'Project Card'}</CardTitle>
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <CardDescription>{card.card_number_masked}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Total Amount</span>
                              <span className="font-semibold">{formatCurrency(Number(card.total_amount))}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Materials</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatCurrency(Number(card.materials_amount))}</span>
                                <Badge variant={card.materials_unlocked ? 'default' : 'secondary'} className="text-xs">
                                  {card.materials_unlocked ? 'Unlocked' : 'Locked'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Labor</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatCurrency(Number(card.labor_amount))}</span>
                                <Badge variant={card.labor_unlocked ? 'default' : 'secondary'} className="text-xs">
                                  {card.labor_unlocked ? 'Unlocked' : 'Locked'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>

              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Your account activity will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-4">
                    <div className="space-y-4">
                      {events.map((event, index) => {
                        const app = applications.find(a => a.id === event.application_id);
                        
                        return (
                          <div key={event.id} className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {formatEventType(event.event_type)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {app?.project_type} • {formatDate(event.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
