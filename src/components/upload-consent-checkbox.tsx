"use client";

import Link from "next/link";

type Props = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Optional extra sentence (e.g. checkout-specific) */
  lead?: string;
};

export function UploadConsentCheckbox({
  id,
  checked,
  onCheckedChange,
  disabled,
  lead,
}: Props) {
  return (
    <label className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 rounded border-input"
      />
      <span className="text-sm text-muted-foreground">
        {lead ? <>{lead} </> : null}
        I confirm I have permission to use these images, they do not infringe
        copyright, and I agree to the{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="font-medium text-primary hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
