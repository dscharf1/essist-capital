import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwords.newPass.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    if (!error) {
      toast({ title: "Password updated successfully" });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } else {
      toast({ title: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your admin account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input className="mt-1" value={user?.email || ""} disabled />
          </div>
          <div>
            <Label>Role</Label>
            <Input className="mt-1" value="Administrator" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input className="mt-1" type="password" value={passwords.newPass}
                onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input className="mt-1" type="password" value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
            </div>
            <Button type="submit" className="bg-[#0d1f1e] text-white hover:bg-[#1a3330]" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loan Product Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between py-2 border-b">
            <span>Loan Range</span><span className="font-medium text-foreground">$5,000 – $30,000</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>Available Terms</span><span className="font-medium text-foreground">6, 12, 18, 24 months</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>Flat Rate (6/12/18 mo)</span><span className="font-medium text-foreground">18%</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>Flat Rate (24 mo)</span><span className="font-medium text-foreground">19%</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Origination Fee</span><span className="font-medium text-foreground">2.5%</span>
          </div>
          <p className="text-xs pt-2">To change loan product terms, update <code>src/lib/calculations.ts</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
