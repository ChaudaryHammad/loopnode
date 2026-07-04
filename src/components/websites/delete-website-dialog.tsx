"use client";

import React, { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  deleteWebsiteAction,
  getWebsiteDeleteNoticeAction,
} from "@/actions/websites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteWebsiteDialogProps {
  websiteId: string;
  websiteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteWebsiteDialog({
  websiteId,
  websiteName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteWebsiteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [loadingNotice, setLoadingNotice] = useState(false);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [canReconnect, setCanReconnect] = useState(true);

  useEffect(() => {
    if (!open) return;

    setLoadingNotice(true);
    setNoticeError(null);
    setDeleteError(null);

    getWebsiteDeleteNoticeAction(websiteId)
      .then((res) => {
        if (!res.success || !res.data) {
          setNoticeError(res.error ?? "Could not load delete details.");
          setSummary("This will permanently remove this website and all of its data.");
          setDetail(null);
          setCanReconnect(true);
          return;
        }

        setSummary(res.data.summary);
        setDetail(res.data.detail);
        setCanReconnect(res.data.canReconnect);
      })
      .finally(() => setLoadingNotice(false));
  }, [open, websiteId]);

  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteWebsiteAction(websiteId);
      if (res.success) {
        onOpenChange(false);
        onDeleted?.();
        return;
      }
      setDeleteError(res.error ?? "Failed to delete website.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Delete {websiteName}?</DialogTitle>
          <DialogDescription>
            {loadingNotice
              ? "Loading domain policy…"
              : summary ?? "This will permanently remove this website and all of its data."}
          </DialogDescription>
        </DialogHeader>

        {!loadingNotice && detail ? (
          <Alert variant={canReconnect ? "default" : "destructive"}>
            <AlertTriangle />
            <AlertDescription className="text-xs leading-relaxed">{detail}</AlertDescription>
          </Alert>
        ) : null}

        {noticeError ? (
          <p className="text-xs text-muted-foreground">{noticeError}</p>
        ) : null}

        {deleteError ? (
          <p className="text-xs text-destructive">{deleteError}</p>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending || loadingNotice}>
            {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {isPending ? "Deleting…" : "Delete website"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
