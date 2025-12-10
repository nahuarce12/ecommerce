"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  email?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const supabase = createClient();
    
    // First get all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profiles) {
      // For each profile, fetch the email from auth.users
      // Note: This requires the profiles table to have the user's email or
      // we need to use a database function to join with auth.users
      // For now, we'll just display the profiles data
      setUsers(profiles);
    }
    
    setLoading(false);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-12 uppercase">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground uppercase mt-1">
          View all registered users
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 uppercase placeholder:uppercase"
        />
      </div>

      {/* Users Table */}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase">User ID</TableHead>
              <TableHead className="uppercase">Full Name</TableHead>
              <TableHead className="uppercase">Role</TableHead>
              <TableHead className="uppercase">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs">
                  {user.id.substring(0, 8)}...
                </TableCell>
                <TableCell className="uppercase text-xs">
                  {user.full_name || "No name"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`uppercase ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground uppercase text-sm">
            No users found
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="border border-yellow-200 bg-yellow-50 p-4 text-xs">
        <p className="uppercase text-yellow-800 font-medium mb-1">
          Note: User Management
        </p>
        <p className="text-yellow-700">
          This page displays user profiles for troubleshooting purposes. Email addresses
          are stored in Supabase Auth and require a server-side query or database function
          to display. Contact admin for full user details including email.
        </p>
      </div>
    </div>
  );
}
