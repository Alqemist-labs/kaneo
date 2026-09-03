import { useTranslation } from "react-i18next";

export function KaneoBranding() {
  const { t } = useTranslation();

  return (
    <a href="/" className="hover:text-foreground transition-colors">
      {t("publicProject:branding.poweredBy")}{" "}
      <span className="font-medium">{t("common:appName")}</span>
    </a>
  );
}
