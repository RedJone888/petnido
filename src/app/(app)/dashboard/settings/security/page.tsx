import {
  DeleteAccountSettings,
  SignInMethodsSettings,
} from "@/modules/auth/client/components/account-security-settings";

export default function SecuritySettingsPage() {
  return (
    <div id="security" className="space-y-5">
      <SignInMethodsSettings />
      <DeleteAccountSettings />
    </div>
  );
}
