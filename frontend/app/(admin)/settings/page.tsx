"use client";

import { Check, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getBranding, updateBranding } from "@/lib/api/settings";
import { uploadImage } from "@/lib/utils/uploadImage";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { useBranding } from "@/lib/branding/branding-context";

const PRESET_COLORS = [
  { name: "Indigo", value: "#5b45d6" },
  { name: "Blue", value: "#2563eb" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Rose", value: "#e11d48" },
  { name: "Amber", value: "#d97706" },
  { name: "Emerald", value: "#059669" },
  { name: "Slate", value: "#475569" },
  { name: "Cyan", value: "#0891b2" },
];

function SavedBadge() {
  return (
    <span className="flex items-center gap-1 text-sm text-success-500">
      <Check size={14} strokeWidth={2.5} />
      Saved
    </span>
  );
}

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const { refreshBranding } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [platformName, setPlatformName] = useState("Auction Platform");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [primaryColor, setPrimaryColor] = useState("#5b45d6");
  const [colorError, setColorError] = useState<string | null>(null);
  const [isSavingColor, setIsSavingColor] = useState(false);
  const [colorSaved, setColorSaved] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSaved, setLogoSaved] = useState(false);

  const fetchBranding = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getBranding(accessToken);
      setPlatformName(data.platform_name);
      setPrimaryColor(data.primary_color);
      setLogoUrl(data.logo_url);
    } catch {
      // Backend endpoint may not exist yet — keep defaults
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchBranding();
  }, [fetchBranding]);

  async function handleSaveName() {
    if (!accessToken) return;
    if (!platformName.trim()) {
      setNameError("Platform name cannot be empty.");
      return;
    }
    setNameError(null);
    setIsSavingName(true);
    setNameSaved(false);
    try {
      await updateBranding(accessToken, { platform_name: platformName.trim() });
      await refreshBranding();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } catch (err) {
      setNameError(err instanceof ApiRequestError ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleSaveColor() {
    if (!accessToken) return;
    setColorError(null);
    setIsSavingColor(true);
    setColorSaved(false);
    try {
      await updateBranding(accessToken, { primary_color: primaryColor });
      await refreshBranding();
      setColorSaved(true);
      setTimeout(() => setColorSaved(false), 3000);
    } catch (err) {
      setColorError(err instanceof ApiRequestError ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSavingColor(false);
    }
  }

  async function handleLogoFile(file: File) {
    if (!accessToken) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Please select an image file (PNG, SVG, JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setLogoError(null);
    setIsUploadingLogo(true);
    setLogoSaved(false);
    try {
      const url = await uploadImage(accessToken, file, "branding");
      await updateBranding(accessToken, { logo_url: url });
      await refreshBranding();
      setLogoUrl(url);
      setLogoPreview(null);
      setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 3000);
    } catch (err) {
      setLogoError(err instanceof ApiRequestError ? err.message : "Upload failed. Please try again.");
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!accessToken) return;
    setLogoError(null);
    try {
      await updateBranding(accessToken, { logo_url: null });
      await refreshBranding();
      setLogoUrl(null);
      setLogoPreview(null);
    } catch (err) {
      setLogoError(err instanceof ApiRequestError ? err.message : "Failed to remove logo.");
    }
  }

  const displayLogo = logoPreview ?? logoUrl;

  return (
    <RequirePermission module="system_settings" need="full">
      <AdminShell>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage platform branding and appearance.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">

              {/* Platform Name */}
              <section className="rounded-xl border border-neutral-200 bg-white p-6">
                <h2 className="text-base font-semibold text-neutral-900">Platform Name</h2>
                <p className="mt-1 mb-5 text-sm text-neutral-500">
                  Shown in the sidebar, browser tab, and outgoing emails.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform-name">Name</Label>
                    <Input
                      id="platform-name"
                      value={platformName}
                      error={nameError ?? undefined}
                      placeholder="Auction Platform"
                      onChange={(e) => {
                        setPlatformName(e.target.value);
                        setNameError(null);
                      }}
                    />
                    <FormError id="platform-name-error" message={nameError ?? undefined} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" className="w-auto" isLoading={isSavingName} onClick={handleSaveName}>
                      Save
                    </Button>
                    {nameSaved ? <SavedBadge /> : null}
                  </div>
                </div>
              </section>

              {/* Logo */}
              <section className="rounded-xl border border-neutral-200 bg-white p-6">
                <h2 className="text-base font-semibold text-neutral-900">Logo</h2>
                <p className="mt-1 mb-5 text-sm text-neutral-500">
                  Appears in the sidebar and topbar. PNG, SVG, or JPG — max 2 MB.
                </p>
                <div className="space-y-4">
                  {displayLogo ? (
                    <div className="relative inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <Image
                        src={displayLogo}
                        alt="Platform logo preview"
                        width={140}
                        height={40}
                        className="object-contain"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        aria-label="Remove logo"
                        className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:text-danger-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 py-10 text-sm text-neutral-500 transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600"
                    >
                      <Upload size={20} />
                      <span>Click to upload logo</span>
                      <span className="text-xs text-neutral-400">PNG, SVG, JPG · max 2 MB</span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoFile(file);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex items-center gap-3">
                    {displayLogo ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-auto"
                        isLoading={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace Logo
                      </Button>
                    ) : null}
                    {logoSaved ? <SavedBadge /> : null}
                  </div>

                  <FormError message={logoError ?? undefined} />
                </div>
              </section>

              {/* Color Palette */}
              <section className="rounded-xl border border-neutral-200 bg-white p-6">
                <h2 className="text-base font-semibold text-neutral-900">Color Palette</h2>
                <p className="mt-1 mb-5 text-sm text-neutral-500">
                  Sets the primary brand color across buttons, links, active nav items, and highlights.
                </p>
                <div className="space-y-5">
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Presets
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_COLORS.map((preset) => {
                        const isSelected = primaryColor.toLowerCase() === preset.value.toLowerCase();
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            title={preset.name}
                            onClick={() => setPrimaryColor(preset.value)}
                            className={`relative h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                              isSelected
                                ? "ring-2 ring-neutral-900 ring-offset-2 scale-110"
                                : "ring-1 ring-neutral-200"
                            }`}
                            style={{ backgroundColor: preset.value }}
                          >
                            {isSelected ? (
                              <Check
                                size={14}
                                strokeWidth={3}
                                className="absolute inset-0 m-auto text-white"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Custom
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                        <div
                          className="h-full w-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          aria-label="Open color picker"
                        />
                      </div>
                      <Input
                        id="primary-color-hex"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#5b45d6"
                        className="w-32 font-mono text-sm"
                      />
                      <div
                        className="flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Button Preview
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      className="w-auto"
                      isLoading={isSavingColor}
                      onClick={handleSaveColor}
                    >
                      Save Color
                    </Button>
                    {colorSaved ? <SavedBadge /> : null}
                  </div>
                  <FormError message={colorError ?? undefined} />
                </div>
              </section>

            </div>
          )}
        </main>
      </AdminShell>
    </RequirePermission>
  );
}
