import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the OH-20221 AFJROTC cadet portal."
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
