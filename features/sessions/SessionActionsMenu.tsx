'use client';

import { useState } from 'react';
import { Copy, Download, MoreHorizontal, Pencil, Trash2, FolderOpen } from 'lucide-react';

export function SessionActionsMenu({
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}: {
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-primary"
        aria-label="Session actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border-subtle bg-elevated p-1 shadow-xl">
            <MenuItem
              icon={<FolderOpen className="h-3.5 w-3.5" />}
              onClick={() => {
                setOpen(false);
                onOpen();
              }}
            >
              Open
            </MenuItem>
            <MenuItem
              icon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => {
                setOpen(false);
                onRename();
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => {
                setOpen(false);
                onDuplicate();
              }}
            >
              Duplicate
            </MenuItem>
            <MenuItem
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                setOpen(false);
                onExport();
              }}
            >
              Export
            </MenuItem>
            <div className="my-1 h-px bg-border-subtle" />
            <MenuItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              danger
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Delete
            </MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  danger,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-hover ${
        danger ? 'text-critical hover:text-critical' : 'text-secondary hover:text-primary'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
