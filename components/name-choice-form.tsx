"use client";

import { motion } from "motion/react";
import { saveSelectedName } from "@/lib/actions";
import type { NamePart } from "@/lib/name";

export function NameChoiceForm({
  fullName,
  parts
}: {
  fullName: string;
  parts: NamePart[];
}) {
  return (
    <form action={saveSelectedName} className="name-choice-form">
      <div className="auth-nameplate">
        <span>Social profile name</span>
        <strong>{fullName}</strong>
      </div>

      <div className="name-options">
        {parts.map((part, index) => (
          <motion.label
            className="name-option"
            key={`${part.label}-${part.value}-${index}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="radio"
              name="selectedChoice"
              value={`${part.label}::${part.value}`}
              defaultChecked={index === 0}
            />
            <span>{part.label}</span>
            <strong>{part.value}</strong>
          </motion.label>
        ))}
      </div>

      <button className="primary-button" type="submit">
        Continue
      </button>
    </form>
  );
}
