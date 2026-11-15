"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Building,
  UserPlus,
  Search,
  X,
  Check,
  Building2,
} from "lucide-react";
import { mockUsers } from "@/lib/mock-data";
import { UserProfile, UserRole } from "@/types";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function UserManagementPage() {
  const { isAdmin, role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form state
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("manager");
  const [newFactory, setNewFactory] = useState("St. Clair - Central Estate");

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const managerCount = users.filter((u) => u.role === "manager").length;
  const activeCount = users.filter((u) => u.status === "active").length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.factory_name && user.factory_name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleStatus = (id: string) => {
    if (!isAdmin) {
      toast.error("Only Estate Admins can change user account status.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: u.status === "active" ? "deactivated" : "active",
            }
          : u
      )
    );
    toast.info("User status updated.");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      full_name: fullName,
      email: newEmail,
      role: newRole,
      factory_name: newRole === "admin" ? "All Factories (Global)" : newFactory,
      status: "active",
      created_at: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    setFullName("");
    setNewEmail("");
    setIsModalOpen(false);
    toast.success(`User ${fullName} created successfully.`);
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#012d1d] text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#116c4a]" />
          <span>Active Node Sync: Zone 4 (Nuwara Eliya Gateway)</span>
        </div>
      </div>

      {/* Header & KPI Band */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#c1ecd4] text-[#002114] text-[11px] font-bold">
              Role-Based Access Control
            </span>
            <span className="text-[12px] text-slate-400">v2.4.1</span>
          </div>
          <h1 className="text-3xl font-bold text-[#012d1d] tracking-tight">
            User Management
          </h1>
          <p className="text-[14px] text-slate-500 max-w-2xl">
            Manage authorized administrative users, factory managers and viewers across high-elevation tea factories.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs border border-slate-200">
            <Users className="w-4 h-4 text-[#0284c7]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
              <span className="text-[13px] font-bold text-[#0b1c30]">{totalUsers} Accounts</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#0b3c5d]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Admins</span>
              <span className="text-[13px] font-bold text-[#0b3c5d]">{adminCount} Global</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-xs border border-slate-200">
            <Building className="w-4 h-4 text-[#116c4a]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Managers</span>
              <span className="text-[13px] font-bold text-[#116c4a]">{managerCount} Factory Leads</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-white shadow-xs bg-gradient-to-r from-[#1b4332] to-[#10b981]">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[13px] font-bold">{activeCount} Active</span>
          </div>
        </div>
      </div>

      {/* Administrator Permission Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 text-[13px]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold">Estate Administrator Privileges Required</p>
              <p className="text-[12px] text-amber-800">
                You are currently signed in as a <span className="font-bold capitalize">{role}</span>. Modification of user profiles, role assignments, and tenant bindings is restricted to Estate Admins.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl shadow-xs border border-slate-200">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or estate..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg text-[13px] text-[#0b1c30] placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0284c7]"
            />
          </div>

          {/* Role Filter: Strictly Admin, Manager, Viewer */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-lg text-[13px] font-medium text-slate-700 border border-slate-200 focus:outline-none focus:border-[#0284c7] cursor-pointer"
          >
            <option value="all">All Roles (Admin, Manager, Viewer)</option>
            <option value="admin">Administrator Only</option>
            <option value="manager">Manager Only</option>
            <option value="viewer">Viewer Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-lg text-[13px] font-medium text-slate-700 border border-slate-200 focus:outline-none focus:border-[#0284c7] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Credentials</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-semibold transition-all shadow-sm cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #0b3c5d 0%, #1b4332 100%)",
            }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6 font-semibold">User</th>
                <th className="py-3 px-6 font-semibold">Email Address</th>
                <th className="py-3 px-6 font-semibold">Role</th>
                <th className="py-3 px-6 font-semibold">Assigned Factory / Division</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredUsers.map((user) => {
                const initials = user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      user.status === "deactivated" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold text-[12px] shadow-xs bg-gradient-to-br from-[#0b3c5d] to-[#1e40af]">
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[#0b1c30] truncate">
                            {user.full_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Authorized Account
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-6">
                      {user.role === "admin" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0b3c5d] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                          Admin
                        </span>
                      )}
                      {user.role === "manager" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#1b4332] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                          Manager
                        </span>
                      )}
                      {user.role === "viewer" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                          Viewer (Read-Only)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{user.factory_name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {user.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                            user.status === "active"
                              ? "text-slate-500 hover:text-[#dc2626] hover:bg-red-50"
                              : "text-[#10b981] hover:bg-emerald-50"
                          }`}
                        >
                          {user.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative flex flex-col gap-5 border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">Add New User</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Invite an authorized user and configure role and factory permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#0b1c30]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priyantha Senanayake"
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-[13px] text-[#0b1c30] border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0284c7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#0b1c30]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. p.senanayake@estate.lk"
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg text-[13px] text-[#0b1c30] border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0284c7]"
                />
              </div>

              {/* Role Selection: Admin, Manager, Viewer ONLY */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#0b1c30]">
                  Role Assignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "manager", "viewer"] as const).map((r) => (
                    <label
                      key={r}
                      className={`flex flex-col p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        newRole === r
                          ? "border-[#116c4a] bg-[#e8f5e9]/50 shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={newRole === r}
                        onChange={() => setNewRole(r)}
                        className="sr-only"
                      />
                      <span className="text-[13px] font-bold capitalize text-[#0b1c30]">
                        {r}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {r === "admin"
                          ? "Global control"
                          : r === "manager"
                          ? "Factory monitor"
                          : "Read-only access"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Factory Assignment (Disabled for Global Admin) */}
              {newRole !== "admin" && (
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">
                    Assigned Tea Factory
                  </label>
                  <select
                    value={newFactory}
                    onChange={(e) => setNewFactory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-lg text-[13px] text-[#0b1c30] border border-slate-200 focus:outline-none focus:bg-white focus:border-[#0284c7] cursor-pointer"
                  >
                    <option value="St. Clair - Central Estate">
                      St. Clair - Central Estate
                    </option>
                    <option value="Dimbula Valley Estate">
                      Dimbula Valley Estate
                    </option>
                    <option value="Nuwara Eliya Estate Div 01">
                      Nuwara Eliya Estate Div 01
                    </option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 text-[13px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1b4332] text-white text-[13px] font-semibold hover:bg-[#012d1d] transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
