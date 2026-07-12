"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Mail, MailOpen, Search } from "lucide-react";
import { updateContactStatusAction } from "@/actions/admin";
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

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export function AdminContactsClient({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NEW" | "READ" | "ARCHIVED">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, search, statusFilter]);

  const newCount = messages.filter((m) => m.status === "NEW").length;

  const setStatus = (id: string, status: "NEW" | "READ" | "ARCHIVED") => {
    startTransition(async () => {
      const res = await updateContactStatusAction(id, status);
      toast.fromAction(res, { success: "Updated." });
      if (res.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/20 pb-6 space-y-1">
        <p className="text-sm text-muted-foreground">
          Contact form submissions · {newCount} unread
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "NEW", "READ", "ARCHIVED"] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? "secondary" : "outline"}
              onClick={() => setStatusFilter(status)}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <Card className="rounded-2xl border-border/30 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No messages match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <TableRow
                      className={msg.status === "NEW" ? "bg-primary/5" : undefined}
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">{msg.name}</p>
                        <p className="text-xs text-muted-foreground">{msg.email}</p>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{msg.subject}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={msg.status === "NEW" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {msg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDateTime(msg.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {msg.status !== "READ" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Mark read"
                              disabled={isPending}
                              onClick={() => setStatus(msg.id, "READ")}
                            >
                              <MailOpen />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Reply via email"
                            render={<a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} />}
                            nativeButton={false}
                          >
                            <Mail />
                          </Button>
                          {msg.status !== "ARCHIVED" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Archive"
                              disabled={isPending}
                              onClick={() => setStatus(msg.id, "ARCHIVED")}
                            >
                              <Archive />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === msg.id && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={5} className="px-4 py-4">
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                            {msg.message}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
