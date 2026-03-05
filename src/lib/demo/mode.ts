export function isDemoMode(): boolean {
  return process.env.CLAW_CONTROL_DEMO === "true";
}
