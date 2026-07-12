"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCheck, RotateCcw, Search, Shield, UserCog } from "lucide-react";
import {
  setUserBannedAction,
  updateUserRoleAction,
  verifyUserEmailAction,
} from "@/actions/admin";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SerializedUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  deletedAt: string | null;
  createdAt: string;
  websiteCount: number;
  subscription: {
    status: string;
    plan: string | null;
    trialEndsAt: string | null;
  } | null;
};

const PAGE_SIZE = 20;

export function AdminUsersClient({ users }: { users: SerializedUser[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const runAction = (fn: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      toast.fromAction(res, { success: "Updated.", error: "Action failed." });
      if (res.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/20 pb-6 space-y-1">
        <p className="text-sm text-muted-foreground">
          Search accounts, change roles, verify email, or ban (soft-delete) users.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      <Card className="rounded-2xl border-border/30 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Subscription</TableHead>
                <TableHead className="hidden sm:table-cell">Sites</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((user) => {
                const isBanned = Boolean(user.deletedAt);
                return (
                  <TableRow key={user.id} className={isBanned ? "opacity-60" : undefined}>
                    <TableCell>
                      <p className="font-medium text-sm">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                        <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                        {isBanned && <Badge variant="destructive" className="text-[10px]">Banned</Badge>}
                        {!user.emailVerified && (
                          <Badge variant="secondary" className="text-[10px]">Unverified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.subscription ? (
                        <span className="text-xs">
                          {user.subscription.status}
                          {user.subscription.plan ? ` · ${user.subscription.plan}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular-nums">
                      {user.websiteCount}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {formatDateTime(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 flex-wrap">
                        {!user.emailVerified && !isBanned && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Mark email verified"
                            disabled={isPending}
                            onClick={() => runAction(() => verifyUserEmailAction(user.id))}
                          >
                            <CheckCheck />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={user.role === "ADMIN" ? "Demote to user" : "Promote to admin"}
                          disabled={isPending}
                          onClick={() =>
                            runAction(() =>
                              updateUserRoleAction(
                                user.id,
                                user.role === "ADMIN" ? "USER" : "ADMIN"
                              )
                            )
                          }
                        >
                          {user.role === "ADMIN" ? <UserCog /> : <Shield />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={isBanned ? "Restore user" : "Ban user"}
                          disabled={isPending}
                          className={isBanned ? undefined : "text-rose-500 hover:text-rose-500"}
                          onClick={() => {
                            if (
                              !isBanned &&
                              !confirm(`Ban ${user.email}? They will not be able to sign in.`)
                            ) {
                              return;
                            }
                            runAction(() => setUserBannedAction(user.id, !isBanned));
                          }}
                        >
                          {isBanned ? <RotateCcw /> : <Ban />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({filtered.length} users)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
