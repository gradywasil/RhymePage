import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}

/**
 * One group of controls inside a Settings section: a hairline above, a
 * heading, an optional line of explanation. No box around it.
 */
export const SettingsSection = ({
  title,
  description,
  danger = false,
  children,
}: SettingsSectionProps) => (
  <section className="border-t border-rule pt-5 pb-7 first:border-t-0 first:pt-1 last:pb-0">
    <h3 className={["text-[17px] font-bold", danger ? "text-danger" : ""].join(" ")}>
      {title}
    </h3>
    {description && <p className="rp-muted mt-1 text-[15px] leading-relaxed">{description}</p>}
    <div className="mt-4 flex flex-col gap-4">{children}</div>
  </section>
);

export default SettingsSection;
