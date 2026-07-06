export const RANK_NAMES: Record<number, { name: string; abbr: string; payGrade: string }> = {
  1: { name: "Airman Basic", abbr: "C/AB", payGrade: "E-1" },
  2: { name: "Airman", abbr: "C/Amn", payGrade: "E-2" },
  3: { name: "Airman First Class", abbr: "C/A1C", payGrade: "E-3" },
  4: { name: "Senior Airman", abbr: "C/SrA", payGrade: "E-4" },
  5: { name: "Staff Sergeant", abbr: "C/SSgt", payGrade: "E-5" },
  6: { name: "Technical Sergeant", abbr: "C/TSgt", payGrade: "E-6" },
  7: { name: "Master Sergeant", abbr: "C/MSgt", payGrade: "E-7" },
  8: { name: "Senior Master Sergeant", abbr: "C/SMSgt", payGrade: "E-8" },
  9: { name: "Chief Master Sergeant", abbr: "C/CMSgt", payGrade: "E-9" }
};

export const RANK_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function isValidRank(rank: number): boolean {
  return Number.isInteger(rank) && rank >= 1 && rank <= 9;
}
