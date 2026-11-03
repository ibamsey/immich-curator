"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SanitizedAdminSettings } from "@/lib/config/admin-settings";
import type { ConfigFieldSource } from "@/lib/config/admin-settings-schema";

type AdminSettingsWorkspaceProps = {
  initial: SanitizedAdminSettings;
};

function EnvBadge({ source }: { source: ConfigFieldSource | "unset" }) {
  if (source === "env" || source === "both") {
    return (
      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
        Set in environment
      </span>
    );
  }
  return null;
}

function fieldLocked(source: ConfigFieldSource | "unset"): boolean {
  return source === "env" || source === "both";
}

export function AdminSettingsWorkspace({ initial }: AdminSettingsWorkspaceProps) {
  const [settings, setSettings] = useState(initial);
  const [immichServerUrl, setImmichServerUrl] = useState(
    initial.immichServerUrl ?? "",
  );
  const [operatorEmail, setOperatorEmail] = useState(
    initial.operatorEmail ?? "",
  );
  const [targetEmail, setTargetEmail] = useState(initial.targetEmail ?? "");
  const [defaultAlbumId, setDefaultAlbumId] = useState(
    initial.defaultAlbumId ?? "",
  );
  const [defaultShareRole, setDefaultShareRole] = useState(
    initial.defaultShareRole,
  );
  const [targetApiKey, setTargetApiKey] = useState("");
  const [operatorApiKey, setOperatorApiKey] = useState("");
  const [adminApiKey, setAdminApiKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    if (res.ok) {
      setSettings(data as SanitizedAdminSettings);
      setImmichServerUrl(data.immichServerUrl ?? "");
      setOperatorEmail(data.operatorEmail ?? "");
      setTargetEmail(data.targetEmail ?? "");
      setDefaultAlbumId(data.defaultAlbumId ?? "");
      setDefaultShareRole(data.defaultShareRole ?? "editor");
    }
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, string | undefined> = {
        defaultShareRole,
      };
      if (!fieldLocked(settings.sources.immichServerUrl)) {
        body.immichServerUrl = immichServerUrl || undefined;
      }
      if (!fieldLocked(settings.sources.operatorEmail)) {
        body.operatorEmail = operatorEmail;
      }
      if (!fieldLocked(settings.sources.targetEmail)) {
        body.targetEmail = targetEmail;
      }
      if (!fieldLocked(settings.sources.defaultAlbumId)) {
        body.defaultAlbumId = defaultAlbumId;
      }
      if (
        targetApiKey.trim() &&
        !fieldLocked(settings.sources.targetApiKey)
      ) {
        body.targetApiKey = targetApiKey.trim();
      }
      if (
        operatorApiKey.trim() &&
        !fieldLocked(settings.sources.operatorApiKey)
      ) {
        body.operatorApiKey = operatorApiKey.trim();
      }
      if (adminApiKey.trim() && !fieldLocked(settings.sources.adminApiKey)) {
        body.adminApiKey = adminApiKey.trim();
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSettings(data as SanitizedAdminSettings);
      setTargetApiKey("");
      setOperatorApiKey("");
      setAdminApiKey("");
      setMessage("Settings saved.");
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(actor: "target" | "operator" | "both") {
    setTesting(actor);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Test failed");
        return;
      }
      if (!data.ok) {
        const parts: string[] = [];
        if (data.target && !data.target.ok) parts.push(`Target: ${data.target.error}`);
        if (data.operator && !data.operator.ok)
          parts.push(`Operator: ${data.operator.error}`);
        setError(parts.join(" · ") || "Connection test failed");
      } else {
        setMessage("Connection test succeeded.");
      }
      await refresh();
    } catch {
      setError("Test failed");
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 text-sm">
      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Connection overview</h2>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Target</p>
            <p>
              {settings.targetConnected ? "Connected" : "Not connected"}
              {settings.targetProfile ? ` · ${settings.targetProfile.email}` : ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Operator</p>
            <p>
              {settings.keysConfigured.operator
                ? settings.operatorConnected
                  ? "Connected"
                  : "Key set, check email/key"
                : "No operator key"}
              {settings.operatorProfile
                ? ` · ${settings.operatorProfile.email}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={testing !== null}
            onClick={() => void handleTest("target")}
          >
            {testing === "target" ? "Testing…" : "Test target"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={testing !== null}
            onClick={() => void handleTest("operator")}
          >
            {testing === "operator" ? "Testing…" : "Test operator"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={testing !== null}
            onClick={() => void handleTest("both")}
          >
            {testing === "both" ? "Testing…" : "Test both"}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Immich server</h2>
          <EnvBadge source={settings.sources.immichServerUrl} />
        </div>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Server URL</span>
          <input
            type="url"
            value={immichServerUrl}
            disabled={fieldLocked(settings.sources.immichServerUrl)}
            onChange={(e) => setImmichServerUrl(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs disabled:opacity-60"
          />
        </label>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Curator target</h2>
          <EnvBadge source={settings.sources.targetApiKey} />
        </div>
        <p className="text-xs text-muted-foreground">
          Library owner — metadata and delete actions use this key.
        </p>
        {settings.targetProfile ? (
          <p className="font-mono text-xs">
            {settings.targetProfile.name} · {settings.targetProfile.email}
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Target API key</span>
          <input
            type="password"
            autoComplete="off"
            placeholder={
              settings.keysConfigured.target ? "Leave blank to keep" : "Paste key"
            }
            value={targetApiKey}
            disabled={fieldLocked(settings.sources.targetApiKey)}
            onChange={(e) => setTargetApiKey(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            Expected target email (optional)
            <EnvBadge source={settings.sources.targetEmail} />
          </span>
          <input
            type="email"
            value={targetEmail}
            disabled={fieldLocked(settings.sources.targetEmail)}
            onChange={(e) => setTargetEmail(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 disabled:opacity-60"
          />
        </label>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Curator operator</h2>
          <EnvBadge source={settings.sources.operatorApiKey} />
        </div>
        <p className="text-xs text-muted-foreground">
          Album share default and UC-003 comments post as this user. Create a
          key in Immich → Account → API Keys.
        </p>
        <label className="flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            Operator email
            <EnvBadge source={settings.sources.operatorEmail} />
          </span>
          <input
            type="email"
            value={operatorEmail}
            disabled={fieldLocked(settings.sources.operatorEmail)}
            onChange={(e) => setOperatorEmail(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Operator API key</span>
          <input
            type="password"
            autoComplete="off"
            placeholder={
              settings.keysConfigured.operator
                ? "Leave blank to keep"
                : "Paste operator key for UC-003 comments"
            }
            value={operatorApiKey}
            disabled={fieldLocked(settings.sources.operatorApiKey)}
            onChange={(e) => setOperatorApiKey(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs disabled:opacity-60"
          />
        </label>
        {settings.operatorUserId ? (
          <p className="font-mono text-xs text-muted-foreground">
            Resolved id: {settings.operatorUserId}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Optional admin API key</h2>
          <EnvBadge source={settings.sources.adminApiKey} />
        </div>
        <p className="text-xs text-muted-foreground">
          Used to resolve operator email → user id when the target key cannot
          list users.
        </p>
        <input
          type="password"
          autoComplete="off"
          placeholder={
            settings.keysConfigured.admin ? "Leave blank to keep" : "Paste key"
          }
          value={adminApiKey}
          disabled={fieldLocked(settings.sources.adminApiKey)}
          onChange={(e) => setAdminApiKey(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs disabled:opacity-60"
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Defaults</h2>
        <label className="flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            Default album id (Explore)
            <EnvBadge source={settings.sources.defaultAlbumId} />
          </span>
          <input
            value={defaultAlbumId}
            disabled={fieldLocked(settings.sources.defaultAlbumId)}
            onChange={(e) => setDefaultAlbumId(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            Default share role
            <EnvBadge source={settings.sources.defaultShareRole} />
          </span>
          <select
            value={defaultShareRole}
            disabled={fieldLocked(settings.sources.defaultShareRole)}
            onChange={(e) => setDefaultShareRole(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 disabled:opacity-60"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
      </section>

      <section className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p>
          Secrets are stored only on the server (
          <code className="text-[11px]">.curator/config.local.json</code>, mode
          600). Environment variables override the Admin file. This Admin page
          has no login in v1 — use only on a trusted LAN.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
