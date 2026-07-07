import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Request cadet portal access for OH-20221 AFJROTC."
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
