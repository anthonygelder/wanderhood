import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";

export function EmailCapture() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Try again.");
    }
  };

  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-10 h-10 opacity-80" />
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold mb-3">
          {t("emailCapture.title")}
        </h2>
        <p className="text-primary-foreground/75 mb-8 text-lg">
          {t("emailCapture.description")}
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-lg font-medium">
            <Check className="w-5 h-5" />
            {t("emailCapture.success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={t("emailCapture.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30"
            />
            <Button
              type="submit"
              disabled={status === "loading"}
              variant="secondary"
              className="shrink-0"
            >
              {status === "loading" ? t("emailCapture.subscribing") : t("emailCapture.subscribe")}
            </Button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm text-primary-foreground/70 mt-3">{errorMsg}</p>
        )}

        <p className="text-xs text-primary-foreground/50 mt-4">
          {t("emailCapture.noSpam")}
        </p>
      </div>
    </section>
  );
}
