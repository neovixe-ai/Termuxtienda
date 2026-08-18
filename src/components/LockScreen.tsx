import { useState, type FormEvent } from "react";
import { Lock, Store } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useApp } from "../lib/store";
import { hashPin } from "../lib/pin";

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const storeName = useApp((s) => s.settings.storeName);
  const pinHash = useApp((s) => s.settings.pinHash);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pinHash && hashPin(pin) === pinHash) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-pop"
      >
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-gradient text-white shadow-md shadow-primary/30">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-foreground">{storeName}</h1>
          <p className="text-sm text-muted">Ingresa tu PIN para continuar</p>
        </div>

        <div className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(false);
            }}
            placeholder="••••"
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
          {error && (
            <p className="text-center text-sm text-danger">PIN incorrecto. Inténtalo de nuevo.</p>
          )}
          <Button type="submit" fullWidth size="lg">
            <Lock className="h-4 w-4" /> Entrar
          </Button>
        </div>
      </form>
    </div>
  );
}
