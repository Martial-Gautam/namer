"use client";

import { motion } from "motion/react";
import { signInWithProvider } from "@/lib/actions";

const providers = [
  { id: "google", label: "Google", hint: "Gmail and Google accounts", initials: "G" },
  { id: "linkedin_oidc", label: "LinkedIn", hint: "Professional profile name", initials: "in" },
  { id: "facebook", label: "Facebook", hint: "Social profile name", initials: "f" },
  { id: "twitter", label: "X", hint: "Public display name", initials: "X" },
  { id: "github", label: "GitHub", hint: "Developer profile name", initials: "gh" },
  { id: "apple", label: "Apple", hint: "Private relay friendly", initials: "A" },
  { id: "azure", label: "Microsoft", hint: "Work or Outlook identity", initials: "M" },
  { id: "discord", label: "Discord", hint: "Community identity", initials: "D" }
];

export function OAuthButtons() {
  return (
    <div className="oauth-grid">
      {providers.map((provider, index) => (
        <motion.form
          action={signInWithProvider.bind(null, provider.id)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          key={provider.id}
        >
          <motion.button
            className="oauth-button"
            type="submit"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
          >
            <span className="provider-icon">{provider.initials}</span>
            <span>
              <strong>Continue with {provider.label}</strong>
              <small>{provider.hint}</small>
            </span>
            <span aria-hidden="true">›</span>
          </motion.button>
        </motion.form>
      ))}
      <div className="oauth-note">
        Instagram login usually needs a Meta custom OAuth setup. The core app is ready for it once the provider is configured.
      </div>
    </div>
  );
}
