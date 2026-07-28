"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ApiRequestError } from "@/lib/api/client";
import { getBranding, updateBranding } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth/session-context";
import { useBranding } from "@/lib/branding/branding-context";
import { uploadImage } from "@/lib/utils/uploadImage";

export default function AgencySettingsPage() {
  const { accessToken } = useAuth();
  const { refreshBranding } = useBranding();

  // Form state
  const [platformName, setPlatformName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#5b45d6");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load current branding on mount
  useEffect(() => {
    if (!accessToken) return;
    getBranding(accessToken)
      .then((b) => {
        setPlatformName(b.platform_name);
        setPrimaryColor(b.primary_color);
        setLogoUrl(b.logo_url);
      })
      .catch(() => setErrorMsg("Could not load current settings."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleSave() {
    if (!accessToken) return;
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Upload new logo if a file was picked
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadImage(accessToken, logoFile, "branding");
      }

      await updateBranding(accessToken, {
        platform_name: platformName.trim() || undefined,
        primary_color: primaryColor,
        logo_url: finalLogoUrl,
      });

      // Refresh branding context so sidebar logo/colour update immediately
      await refreshBranding();

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      setSuccessMsg("Settings saved. All login pages now reflect the new branding.");
    } catch (err) {
      setErrorMsg(
        err instanceof ApiRequestError ? err.message : "Failed to save. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AgencyShell>
        <div className="flex h-full items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      </AgencyShell>
    );
  }

  const displayLogo = logoPreview ?? logoUrl;

  return (
    <AgencyShell>
      <main className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Platform Settings</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Changes here reflect on all login pages across the platform.
          </p>
        </div>

        <div className="max-w-xl space-y-8">
          {/* ── Logo ── */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Platform Logo</h2>

            <div className="flex items-start gap-5">
              {/* Preview box */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50">
                {displayLogo ? (
                  <Image
                    src={displayLogo}
                    alt="Logo preview"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-neutral-400">No logo</span>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {displayLogo ? "Change logo" : "Upload logo"}
                </button>
                {displayLogo && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="ml-2 rounded-lg border border-danger-200 px-4 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-neutral-400">PNG, JPG or SVG · max 2 MB</p>
              </div>
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </section>

          {/* ── Platform name ── */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Platform Name</h2>
            <div>
              <Label htmlFor="platform-name">Name</Label>
              <Input
                id="platform-name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="e.g. Auction Platform"
                maxLength={80}
              />
              <p className="mt-1 text-xs text-neutral-400">
                Shown in the sidebar header and browser tab on all login pages.
              </p>
            </div>
          </section>

          {/* ── Brand colour ── */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Brand Colour</h2>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-lg border border-neutral-200 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#5b45d6"
                className="w-32 font-mono"
                maxLength={7}
              />
              {/* Live colour swatch */}
              <div
                className="h-11 w-11 rounded-lg border border-neutral-200 shadow-inner"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Applied as the primary accent colour on all login pages and buttons.
            </p>
          </section>

          {/* ── Live preview ── */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">Preview</h2>
            <div
              className="flex items-center gap-3 rounded-lg p-4"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              {displayLogo ? (
                <Image
                  src={displayLogo}
                  alt="Preview"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-lg object-contain"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {platformName?.[0]?.toUpperCase() ?? "A"}
                </div>
              )}
              <span className="text-base font-semibold text-neutral-900">
                {platformName || "Auction Platform"}
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              This is how the branding appears on the login page header.
            </p>
          </section>

          {/* Feedback */}
          {successMsg && (
            <p className="rounded-lg bg-success-500/10 px-4 py-3 text-sm text-success-700">
              {successMsg}
            </p>
          )}
          {errorMsg && (
            <p className="rounded-lg bg-danger-500/10 px-4 py-3 text-sm text-danger-700">
              {errorMsg}
            </p>
          )}

          {/* Save */}
          <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </main>
    </AgencyShell>
  );
}
