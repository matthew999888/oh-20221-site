"use client";

import { useState, type ReactNode } from "react";

type TabKey =
  | "announcements"
  | "calendar"
  | "gallery"
  | "instructors"
  | "photos"
  | "faq"
  | "messages";

export default function WebsiteAdminTabs({
  announcements,
  calendar,
  gallery,
  instructors,
  photos,
  faq,
  messages,
  unreadCount
}: {
  announcements: ReactNode;
  calendar: ReactNode;
  gallery: ReactNode;
  instructors: ReactNode;
  photos: ReactNode;
  faq: ReactNode;
  messages: ReactNode;
  unreadCount: number;
}) {
  const [tab, setTab] = useState<TabKey>("announcements");

  const tabs: { key: TabKey; label: string; icon: string; badge?: number }[] = [
    { key: "announcements", label: "Announcements", icon: "fa-solid fa-bullhorn" },
    { key: "calendar", label: "Calendar", icon: "fa-solid fa-calendar-days" },
    { key: "gallery", label: "Gallery", icon: "fa-solid fa-images" },
    { key: "instructors", label: "Instructors", icon: "fa-solid fa-user-tie" },
    { key: "photos", label: "Homepage photos", icon: "fa-solid fa-image" },
    { key: "faq", label: "FAQ", icon: "fa-solid fa-circle-question" },
    {
      key: "messages",
      label: "Messages",
      icon: "fa-solid fa-envelope",
      badge: unreadCount || undefined
    }
  ];

  return (
    <div>
      <div
        className="content-block__actions"
        style={{ marginBottom: "1.25rem", gap: "0.5rem", flexWrap: "wrap" }}
        role="tablist"
        aria-label="Website content sections"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`btn-small${tab === t.key ? " btn-small--primary" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <i className={t.icon} aria-hidden="true" /> {t.label}
            {t.badge ? (
              <span
                style={{
                  marginLeft: "0.4rem",
                  padding: "0.05rem 0.4rem",
                  borderRadius: "999px",
                  background: "var(--flag-red, #ea5c73)",
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 700
                }}
              >
                {t.badge}
                <span className="sr-only"> unread messages</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "announcements" && announcements}
      {tab === "calendar" && calendar}
      {tab === "gallery" && gallery}
      {tab === "instructors" && instructors}
      {tab === "photos" && photos}
      {tab === "faq" && faq}
      {tab === "messages" && messages}
    </div>
  );
}
