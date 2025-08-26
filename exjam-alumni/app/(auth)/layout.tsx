import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | ExJAM Alumni Auth",
    default: "Authentication | ExJAM Alumni",
  },
  description: "Sign in or create your ExJAM Alumni account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Add any auth-specific layout components here */}
      {children}
    </>
  );
}