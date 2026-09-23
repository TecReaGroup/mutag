/** Remove transport prefixes from errors displayed to the user. */
export function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/^Error invoking remote method '[^']+':\s*/i, "")
    .replace(/^Error:\s*/i, "");
}
