import { useAuth } from "../context/useAuth";
import { useWorkoutHistory } from "../context/useWorkoutHistory";
import { useI18n } from "../i18nContext";

export function AuthStatus() {
  const { t } = useI18n();
  const { isConfigured, status, user, signIn, signOut } = useAuth();
  const { syncStatus } = useWorkoutHistory();

  if (!isConfigured) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
        {t("auth.localOnly")}
      </div>
    );
  }

  if (status === "signed-in" && user) {
    return (
      <div className="rounded-lg border border-emerald-900/70 bg-emerald-950/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-emerald-100">
              {t("auth.signedIn", { name: user.displayName })}
            </div>
            <div className="text-xs text-emerald-200/80">
              {syncStatus === "syncing"
                ? t("auth.syncing")
                : syncStatus === "error"
                ? t("auth.syncError")
                : t("auth.synced")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-900/60"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-100">
            {t("auth.optionalTitle")}
          </div>
          <div className="text-xs text-slate-400">{t("auth.optionalHelp")}</div>
        </div>
        <button
          type="button"
          onClick={signIn}
          disabled={status === "loading"}
          className="rounded-lg border border-emerald-800 bg-emerald-950/60 px-3 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-900/70 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? t("auth.loading") : t("auth.signIn")}
        </button>
      </div>
    </div>
  );
}
