import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("loan_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Group by email to get unique clients
      const uniqueClients = data.reduce((acc: any[], curr) => {
        const existing = acc.find((c) => c.email === curr.email);
        if (!existing) {
          acc.push({
            ...curr,
            applicationCount: data.filter((d) => d.email === curr.email).length,
            totalAmount: data
              .filter((d) => d.email === curr.email)
              .reduce((sum, d) => sum + Number(d.requested_amount), 0),
          });
        }
        return acc;
      }, []);
      setClients(uniqueClients);
    }
    setIsLoading(false);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "funds_released":
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Button>
          <Filter className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {client.first_name?.[0]}
                      {client.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {client.first_name} {client.last_name}
                    </CardTitle>
                    <Badge variant="secondary" className={getStatusColor(client.status)}>
                      {client.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/application/${client.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.city && client.state && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {client.city}, {client.state}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">Applications</p>
                  <p className="font-semibold">{client.applicationCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${client.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No clients found
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminClients;
