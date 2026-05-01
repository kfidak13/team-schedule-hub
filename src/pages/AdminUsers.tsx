import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type AppRole, type Profile } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Trash2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ROLE_OPTIONS: { value: AppRole; label: string; color: string }[] = [
  { value: 'admin',       label: 'Admin',       color: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40' },
  { value: 'stats_admin', label: 'Stats Admin', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  { value: 'coach',       label: 'Coach',       color: 'bg-green-500/20 text-green-400 border-green-500/40' },
  { value: 'student',     label: 'Student',     color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { value: 'viewer',      label: 'Viewer',      color: 'bg-muted text-muted-foreground border-border' },
];

function roleBadge(role: AppRole) {
  const opt = ROLE_OPTIONS.find(r => r.value === role);
  return (
    <Badge variant="outline" className={opt?.color}>
      {opt?.label ?? role}
    </Badge>
  );
}

export default function AdminUsers() {
  const { isAdmin, fetchAllProfiles, updateUserRole, deleteProfile, profile: me } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllProfiles();
    setProfiles(data);
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: AppRole) {
    const { error } = await updateUserRole(userId, newRole);
    if (error) {
      toast.error(`Failed: ${error}`);
      return;
    }
    toast.success('Role updated');
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
  }

  async function handleDelete(userId: string, email: string) {
    if (userId === me?.id) {
      toast.error("You can't delete your own profile.");
      return;
    }
    if (!window.confirm(`Delete profile for ${email}? This removes their role but does NOT delete their auth account.`)) return;
    const { error } = await deleteProfile(userId);
    if (error) {
      toast.error(`Failed: ${error}`);
      return;
    }
    toast.success('Profile deleted');
    setProfiles(prev => prev.filter(p => p.id !== userId));
  }

  const filtered = profiles.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.email.toLowerCase().includes(q) ||
      p.displayName.toLowerCase().includes(q) ||
      p.role.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Promote users to coach, stats admin, or admin. New accounts default to viewer.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    {p.displayName || '—'}
                    {p.id === me?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {roleBadge(p.role)}
                      <Select value={p.role} onValueChange={(v) => handleRoleChange(p.id, v as AppRole)}>
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(p.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(p.id, p.email)}
                      disabled={p.id === me?.id}
                      title="Delete profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
