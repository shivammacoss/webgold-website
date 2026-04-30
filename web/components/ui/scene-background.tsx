/** Premium ambient backdrop — soft warm spotlights with a subtle gold accent.
 * Replaces all earlier "moving" backgrounds. Drop once at the layout level. */
export function SceneBackground() {
  return (
    <div
      aria-hidden
      className="ambient-bg pointer-events-none fixed inset-0 -z-10"
    />
  );
}
