"use client";

import { useState, type ReactNode } from "react";

export default function WebsiteAdminTabs({
  announcements,
  calendar,
  gallery
}: {
  announcements: ReactNode;
  calendar: ReactNode;
  gallery: ReactNode;
}) {
  const [tab, setTab] = useState<"announcements" | "calendar" | "gallery">("announcements");

  const tabs: { key: typeof tab; label: string; icon: string }[] = [
    { key: "announcements", label: "Announcements", icon: "fa-solid fa-bullhorn" },
    { key: "calendar", label: "Calendar", icon: "fa-solid fa-calendar-days" },
    { key: "gallery", label: "Gallery", icon: "fa-solid fa-images" }
  ];

  return (
    <div>
      <div className="content-block__actions" style={{ marginBottom: "1.25rem", gap: "0.5rem" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`btn-small${tab === t.key ? " btn-small--primary" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "announcements" && announcements}
      {tab === "calendar" && calendar}
      {tab === "gallery" && gallery}
    </div>
  );
}
