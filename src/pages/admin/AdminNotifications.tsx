import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCircle2,
  FileSignature,
  CreditCard,
  ClipboardCheck,
  Wallet,
  Clock,
  Trash2,
  CheckCheck,
} from "lucide-react";

interface WorkflowEvent {
  id: string;
  application_id: string;
  event_type: string;
  event_data: any;
  triggered_by: string;
  created_at: string;
  read?: boolean;
}

const eventIcons: Record<string, any> = {
  application_submitted: FileSignature,
  document_sent: FileSignature,
  document_signed: CheckCircle2,
  card_provisioned: CreditCard,
  project_started: Clock,
  inspection_scheduled: ClipboardCheck,
  inspection_completed: ClipboardCheck,
  labor_funds_released: Wallet,
};

const eventColors: Record<string, string> = {
  application_submitted: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
  document_sent: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
  document_signed: "bg-green-100 text-green-600 dark:bg-green-900/30",
  card_provisioned: "bg-primary/10 text-primary",
  project_started: "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
  inspection_scheduled: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30",
  inspection_completed: "bg-green-100 text-green-600 dark:bg-green-900/30",
  labor_funds_released: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
};

const AdminNotifications = () => {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readEvents, setReadEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEvents();
    // Load read state from localStorage
    const stored = localStorage.getItem("readNotifications");
    if (stored) {
      setReadEvents(new Set(JSON.parse(stored)));
    }
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("workflow_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      setEvents(data);
    }
    setIsLoading(false);
  };

  const markAsRead = (eventId: string) => {
    const newReadEvents = new Set(readEvents);
    newReadEvents.add(eventId);
    setReadEvents(newReadEvents);
    localStorage.setItem("readNotifications", JSON.stringify([...newReadEvents]));
  };

  const markAllAsRead = () => {
    const allIds = new Set(events.map((e) => e.id));
    setReadEvents(allIds);
    localStorage.setItem("readNotifications", JSON.stringify([...allIds]));
  };

  const clearAllRead = () => {
    setReadEvents(new Set());
    localStorage.removeItem("readNotifications");
  };

  const unreadEvents = events.filter((e) => !readEvents.has(e.id));
  const todayEvents = events.filter((e) => {
    const today = new Date();
    const eventDate = new Date(e.created_at);
    return eventDate.toDateString() === today.toDateString();
  });

  const getEventMessage = (event: WorkflowEvent) => {
    switch (event.event_type) {
      case "application_submitted":
        return "New loan application submitted";
      case "document_sent":
        return "Document sent for signature";
      case "document_signed":
        return "Document signed by applicant";
      case "card_provisioned":
        return "Project card provisioned";
      case "project_started":
        return "Project has been started";
      case "inspection_scheduled":
        return "Inspection scheduled";
      case "inspection_completed":
        return event.event_data?.passed
          ? "Inspection passed successfully"
          : "Inspection requires revision";
      case "labor_funds_released":
        return `Labor funds released: $${event.event_data?.labor_amount?.toLocaleString()}`;
      default:
        return event.event_type.replace(/_/g, " ");
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const NotificationItem = ({ event }: { event: WorkflowEvent }) => {
    const Icon = eventIcons[event.event_type] || Bell;
    const colorClass = eventColors[event.event_type] || "bg-muted text-muted-foreground";
    const isRead = readEvents.has(event.id);

    return (
      <div
        className={`flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer ${
          isRead ? "bg-transparent hover:bg-muted/50" : "bg-muted/50 hover:bg-muted"
        }`}
        onClick={() => markAsRead(event.id)}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm ${isRead ? "text-muted-foreground" : "font-medium"}`}>
                {getEventMessage(event)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.triggered_by === "user"
                  ? "By applicant"
                  : event.triggered_by === "system"
                  ? "Automated"
                  : `By ${event.triggered_by}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{formatTimeAgo(event.created_at)}</span>
              {!isRead && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on workflow events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearAllRead}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Read Status
          </Button>
          <Button size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{unreadEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                Unread
                {unreadEvents.length > 0 && (
                  <Badge variant="secondary">{unreadEvents.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-2">
                {events.map((event) => (
                  <NotificationItem key={event.id} event={event} />
                ))}
                {events.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="unread" className="mt-4">
              <div className="space-y-2">
                {unreadEvents.map((event) => (
                  <NotificationItem key={event.id} event={event} />
                ))}
                {unreadEvents.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>All caught up!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="today" className="mt-4">
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <NotificationItem key={event.id} event={event} />
                ))}
                {todayEvents.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events today</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};

export default AdminNotifications;
