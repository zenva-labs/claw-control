export function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "reset") return "info" as const;
  if (status === "deleted") return "danger" as const;
  return "outline" as const;
}

export function getStatusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "reset") return "Reset";
  if (status === "deleted") return "Deleted";
  return status;
}
