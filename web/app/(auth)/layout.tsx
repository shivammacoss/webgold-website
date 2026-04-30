import { SceneBackground } from "@/components/ui/scene-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <SceneBackground />
      <div className="relative flex min-h-screen items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
