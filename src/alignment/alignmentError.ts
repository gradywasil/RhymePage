/** Turns browser and WebAssembly failures into a safe, actionable UI message. */
export function describeAlignmentError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  if (typeof error === "string" && error) return error;
  return "The vocal guide could not be processed.";
}
