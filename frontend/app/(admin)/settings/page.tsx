"use client";

import {
  Bell,
  CheckCircle2,
  Globe,
  Gavel,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";

type Tab = "general" | "auction" | "notifications" | "security";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General", icon: Globe },
  { key: "auction", label: "Auction Rules", icon: Gavel },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {children}
    </h3>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-6 py-5 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-neutral-400">{hint}</p> : null}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-neutral-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full max-w-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
    />
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full max-w-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [saved, setSaved] = useState(false);

  // General
  const [platformName, setPlatformName] = useState("Auction Platform");
  const [supportEmail, setSupportEmail] = useState("support@auctionplatform.com");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Auction Rules
  const [minBidIncrement, setMinBidIncrement] = useState("50");
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState("3");
  const [approvalQuorum, setApprovalQuorum] = useState("2");
  const [defaultDurationHours, setDefaultDurationHours] = useState("48");
  const [buyNowEnabled, setBuyNowEnabled] = useState(true);

  // Notifications
  const [emailBid, setEmailBid] = useState(true);
  const [emailAuctionEnd, setEmailAuctionEnd] = useState(true);
  const [emailNewUser, setEmailNewUser] = useState(true);
  const [emailKyc, setEmailKyc] = useState(true);
  const [pushBid, setPushBid] = useState(true);
  const [pushAuctionEnd, setPushAuctionEnd] = useState(true);

  // Security
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [require2fa, setRequire2fa] = useState(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [ipWhitelist, setIpWhitelist] = useState("");

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AdminShell>
      <RequirePermission module="system_settings" need="full">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage platform configuration and system preferences.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {/* Tab bar */}
            <div className="flex border-b border-neutral-200">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-b-2 border-brand-500 text-brand-600"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* GENERAL */}
              {activeTab === "general" && (
                <div>
                  <SectionTitle>Platform Identity</SectionTitle>
                  <Field label="Platform Name" hint="Shown in the browser tab and emails.">
                    <InputField value={platformName} onChange={setPlatformName} placeholder="e.g. Auction Platform" />
                  </Field>
                  <Field label="Support Email" hint="Buyers and sellers see this for support queries.">
                    <InputField value={supportEmail} onChange={setSupportEmail} type="email" placeholder="support@example.com" />
                  </Field>

                  <div className="mt-6">
                    <SectionTitle>Locale</SectionTitle>
                  </div>
                  <Field label="Default Currency" hint="Currency used across the platform.">
                    <SelectField
                      value={currency}
                      onChange={setCurrency}
                      options={[
                        { value: "USD", label: "USD — US Dollar" },
                        { value: "EUR", label: "EUR — Euro" },
                        { value: "GBP", label: "GBP — British Pound" },
                        { value: "INR", label: "INR — Indian Rupee" },
                        { value: "AED", label: "AED — UAE Dirham" },
                      ]}
                    />
                  </Field>
                  <Field label="Timezone" hint="Default timezone for auction schedules.">
                    <SelectField
                      value={timezone}
                      onChange={setTimezone}
                      options={[
                        { value: "UTC", label: "UTC" },
                        { value: "America/New_York", label: "Eastern Time (ET)" },
                        { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
                        { value: "Europe/London", label: "London (GMT)" },
                        { value: "Asia/Dubai", label: "Dubai (GST)" },
                        { value: "Asia/Kolkata", label: "India (IST)" },
                        { value: "Asia/Singapore", label: "Singapore (SGT)" },
                      ]}
                    />
                  </Field>
                  <Field label="Language" hint="Default interface language.">
                    <SelectField
                      value={language}
                      onChange={setLanguage}
                      options={[
                        { value: "en", label: "English" },
                        { value: "ar", label: "Arabic" },
                        { value: "hi", label: "Hindi" },
                      ]}
                    />
                  </Field>
                </div>
              )}

              {/* AUCTION RULES */}
              {activeTab === "auction" && (
                <div>
                  <SectionTitle>Bidding</SectionTitle>
                  <Field label="Minimum Bid Increment" hint="The smallest amount a new bid must exceed the current bid by.">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">$</span>
                      <InputField value={minBidIncrement} onChange={setMinBidIncrement} type="number" placeholder="50" />
                    </div>
                  </Field>
                  <Field label="Default Auction Duration" hint="How long a new auction runs before it closes.">
                    <div className="flex items-center gap-2">
                      <InputField value={defaultDurationHours} onChange={setDefaultDurationHours} type="number" placeholder="48" />
                      <span className="text-sm text-neutral-500">hours</span>
                    </div>
                  </Field>
                  <Field label="Buy Now" hint="Allow sellers to set a Buy Now price on listings.">
                    <Toggle checked={buyNowEnabled} onChange={setBuyNowEnabled} label="Enable Buy Now pricing" />
                  </Field>

                  <div className="mt-6">
                    <SectionTitle>Approval Workflow</SectionTitle>
                  </div>
                  <Field label="Approval Quorum" hint="Number of seat votes required before a listing goes live.">
                    <SelectField
                      value={approvalQuorum}
                      onChange={setApprovalQuorum}
                      options={[
                        { value: "1", label: "1 of 3 seats" },
                        { value: "2", label: "2 of 3 seats (recommended)" },
                        { value: "3", label: "All 3 seats" },
                      ]}
                    />
                  </Field>
                  <Field label="Live Auction Advance Notice" hint="Minimum days a seller must submit a live auction request before going live.">
                    <div className="flex items-center gap-2">
                      <InputField value={advanceNoticeDays} onChange={setAdvanceNoticeDays} type="number" placeholder="3" />
                      <span className="text-sm text-neutral-500">days</span>
                    </div>
                  </Field>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div>
                  <SectionTitle>Email Notifications</SectionTitle>
                  <Field label="New Bid Placed" hint="Notify seller and admin when a new bid is placed.">
                    <Toggle checked={emailBid} onChange={setEmailBid} label="Send email on new bid" />
                  </Field>
                  <Field label="Auction Ended" hint="Notify seller and winning bidder when an auction closes.">
                    <Toggle checked={emailAuctionEnd} onChange={setEmailAuctionEnd} label="Send email when auction ends" />
                  </Field>
                  <Field label="New User Registration" hint="Notify admin when a new buyer or seller registers.">
                    <Toggle checked={emailNewUser} onChange={setEmailNewUser} label="Send email on new registration" />
                  </Field>
                  <Field label="KYC Submission" hint="Notify admin when a user submits their KYC documents.">
                    <Toggle checked={emailKyc} onChange={setEmailKyc} label="Send email on KYC submission" />
                  </Field>

                  <div className="mt-6">
                    <SectionTitle>Push Notifications</SectionTitle>
                  </div>
                  <Field label="Bid Notifications" hint="Browser push when a new bid is placed.">
                    <Toggle checked={pushBid} onChange={setPushBid} label="Enable bid push notifications" />
                  </Field>
                  <Field label="Auction End Alerts" hint="Browser push when an auction closes.">
                    <Toggle checked={pushAuctionEnd} onChange={setPushAuctionEnd} label="Enable auction end push notifications" />
                  </Field>
                </div>
              )}

              {/* SECURITY */}
              {activeTab === "security" && (
                <div>
                  <SectionTitle>Session & Access</SectionTitle>
                  <Field label="Session Timeout" hint="Automatically log out inactive users after this many minutes.">
                    <div className="flex items-center gap-2">
                      <InputField value={sessionTimeout} onChange={setSessionTimeout} type="number" placeholder="60" />
                      <span className="text-sm text-neutral-500">minutes</span>
                    </div>
                  </Field>
                  <Field label="Max Login Attempts" hint="Lock account after this many failed login attempts.">
                    <InputField value={maxLoginAttempts} onChange={setMaxLoginAttempts} type="number" placeholder="5" />
                  </Field>
                  <Field label="Two-Factor Authentication" hint="Require 2FA for all staff accounts.">
                    <Toggle checked={require2fa} onChange={setRequire2fa} label="Require 2FA for staff login" />
                  </Field>

                  <div className="mt-6">
                    <SectionTitle>IP Restrictions</SectionTitle>
                  </div>
                  <Field label="Admin IP Allowlist" hint="Restrict admin access to these IPs (comma-separated). Leave blank to allow all.">
                    <textarea
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      rows={3}
                      placeholder="e.g. 203.0.113.0, 198.51.100.0"
                      className="w-full max-w-sm rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Footer save bar */}
            <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-6 py-4">
              {saved ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 size={15} /> Settings saved
                </span>
              ) : (
                <span className="text-xs text-neutral-400">Changes are not applied to live auctions in progress.</span>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </RequirePermission>
    </AdminShell>
  );
}
