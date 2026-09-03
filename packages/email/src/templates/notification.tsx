import { Link, Section, Text } from "@react-email/components";
import React from "react";
import { resolveEmailLocale } from "./resolve-locale";
import { EmailShell, styles } from "./shell";

void React;

export type NotificationEmailProps = {
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string;
  locale?: string | null;
};

const messages = {
  en: {
    preview: "You have a new Alqemist Tickets notification",
    subtitle: "A notification matched your delivery preferences.",
    footer: "Alqemist Tickets notification",
    actionLabel: "Open in Alqemist Tickets",
  },
  de: {
    preview: "Du hast eine neue Alqemist Tickets-Benachrichtigung",
    subtitle:
      "Eine Benachrichtigung entspricht deinen Zustellungs-Einstellungen.",
    footer: "Alqemist Tickets-Benachrichtigung",
    actionLabel: "In Alqemist Tickets oeffnen",
  },
  vi: {
    preview: "Bạn có thông báo mới từ Alqemist Tickets",
    subtitle: "Một thông báo khớp với tùy chọn nhận thông báo của bạn.",
    footer: "Thông báo Alqemist Tickets",
    actionLabel: "Mở trong Alqemist Tickets",
  },
  ja: {
    preview: "Alqemist Tickets の新しい通知",
    subtitle: "配信設定に一致する通知がありました。",
    footer: "Alqemist Tickets 通知",
    actionLabel: "Alqemist Tickets で開く",
  },
} as const;

const NotificationEmail = ({
  title,
  message,
  actionUrl,
  actionLabel,
  locale,
}: NotificationEmailProps) => {
  const copy = messages[resolveEmailLocale(locale)];

  return (
    <EmailShell preview={copy.preview} title={title} subtitle={copy.subtitle}>
      <Section>
        <Text style={styles.paragraph}>{message}</Text>
        {actionUrl ? (
          <Link style={styles.button} href={actionUrl}>
            {actionLabel ?? copy.actionLabel}
          </Link>
        ) : null}
        <Section style={styles.divider} />
        <Text style={styles.footer}>{copy.footer}</Text>
      </Section>
    </EmailShell>
  );
};

NotificationEmail.PreviewProps = {
  title: "Task assigned to you",
  message: "You were assigned to Design account notifications.",
  actionUrl: "https://kaneo.app",
} as NotificationEmailProps;

export default NotificationEmail;
