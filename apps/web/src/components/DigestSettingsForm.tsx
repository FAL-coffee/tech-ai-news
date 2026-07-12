"use client";

import { useState, useTransition } from "react";

export function DigestSettingsForm({
  initialWeeklyEnabled,
  initialMinImportance,
  initialSlackWebhookUrl,
  initialSlackEnabled,
}: {
  initialWeeklyEnabled: boolean;
  initialMinImportance: number;
  initialSlackWebhookUrl: string | null;
  initialSlackEnabled: boolean;
}) {
  const [weeklyEnabled, setWeeklyEnabled] = useState(initialWeeklyEnabled);
  const [minImportance, setMinImportance] = useState(initialMinImportance);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(initialSlackWebhookUrl ?? "");
  const [slackEnabled, setSlackEnabled] = useState(initialSlackEnabled);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weeklyDigestEnabled: weeklyEnabled,
          minImportance,
          slackWebhookUrl: slackWebhookUrl.trim() || undefined,
          slackEnabled,
        }),
      });
      setSaved(true);
    });
  }

  return (
    <div className="digest-settings-form">
      <label className="consent-checkbox">
        <input type="checkbox" checked={weeklyEnabled} onChange={(e) => setWeeklyEnabled(e.target.checked)} />
        <span>週次まとめ(重要度の高い記事だけのハイライト)を受け取る</span>
      </label>

      <div className="digest-setting-row">
        <label htmlFor="min-importance">重要度フィルタ(この値未満の記事はメールに含めない)</label>
        <div className="digest-setting-inline">
          <input
            id="min-importance"
            type="range"
            min={0}
            max={100}
            step={10}
            value={minImportance}
            onChange={(e) => setMinImportance(Number(e.target.value))}
          />
          <span className="digest-setting-value">{minImportance}</span>
        </div>
      </div>

      <div className="digest-setting-row">
        <label htmlFor="slack-webhook-url">Slack Incoming Webhook URL</label>
        <input
          id="slack-webhook-url"
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={slackWebhookUrl}
          onChange={(e) => setSlackWebhookUrl(e.target.value)}
        />
        <p className="meta">
          Slackの「Incoming Webhooks」アプリでチャンネル用のURLを発行し、ここに貼り付けてください。
        </p>
        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={slackEnabled}
            disabled={!slackWebhookUrl.trim()}
            onChange={(e) => setSlackEnabled(e.target.checked)}
          />
          <span>ダイジェストをSlackにも送信する</span>
        </label>
      </div>

      <div className="topic-save-row">
        <button type="button" className="btn btn-primary" onClick={save} disabled={isPending}>
          {isPending ? "保存中..." : "保存"}
        </button>
        {saved && !isPending && <span className="topic-save-confirm">保存しました</span>}
      </div>
    </div>
  );
}
