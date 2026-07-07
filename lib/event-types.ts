export type EventTypeValue = "ldr" | "squadron_activity" | "community_service" | "other";

export const EVENT_TYPES: { value: EventTypeValue; label: string; icon: string }[] = [
  { value: "ldr", label: "LDR", icon: "fa-solid fa-flag" },
  { value: "squadron_activity", label: "Squadron Activity", icon: "fa-solid fa-people-group" },
  { value: "community_service", label: "Community Service", icon: "fa-solid fa-hand-holding-heart" },
  { value: "other", label: "Other", icon: "fa-solid fa-ellipsis" }
];

export function eventTypeLabel(type: string): string {
  return EVENT_TYPES.find((t) => t.value === type)?.label ?? "Other";
}

export function eventTypeIcon(type: string): string {
  return EVENT_TYPES.find((t) => t.value === type)?.icon ?? "fa-solid fa-ellipsis";
}
