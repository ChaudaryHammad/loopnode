"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const res = await getNotificationsAction(15);
      if (res.success && res.data) {
        setNotifications(
          res.data.notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
            readAt: n.readAt?.toISOString() ?? null,
          }))
        );
        setUnreadCount(res.data.unreadCount);
      }
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = (id: string, href: string | null) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      load();
      if (href) setOpen(false);
    });
  };

  const markAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      load();
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" className="relative rounded-xl" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-normal text-primary hover:underline"
                disabled={isPending}
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            const content = (
              <div
                className={cn(
                  "flex flex-col gap-0.5 py-0.5",
                  !n.readAt && "font-medium"
                )}
              >
                <span className="text-sm text-foreground">{n.title}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
                <span className="text-[10px] text-muted-foreground/80">
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
            );

            if (n.href) {
              return (
                <DropdownMenuItem
                  key={n.id}
                  render={
                    <Link
                      href={n.href}
                      onClick={() => markRead(n.id, n.href)}
                    />
                  }
                >
                  {content}
                </DropdownMenuItem>
              );
            }

            return (
              <DropdownMenuItem key={n.id} onClick={() => markRead(n.id, null)}>
                {content}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
