"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  children,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="page-icon-tile">
            <Icon />
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="page-description mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.icon ? (
              <action.icon className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
