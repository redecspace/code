import SettingsPage from "@/components/pages/settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Redec",
  description: "Manage your data, storage, and application preferences.",
};

export default function Page() {
  return <SettingsPage />;
}
