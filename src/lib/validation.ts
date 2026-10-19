import { StrKey } from "@stellar/stellar-sdk";

export const STROOPS = 10_000_000n;
export const MIN_PERIOD = 60;

/** "12.5" -> 125000000n. Returns null for anything that is not a positive amount with <= 7 decimals. */
export function toStroops(input: string): bigint | null {
  const m = /^(\d+)(?:\.(\d{1,7}))?$/.exec(input.trim());
  if (!m) return null;
  const v = BigInt(m[1]!) * STROOPS + BigInt((m[2] ?? "").padEnd(7, "0"));
  return v > 0n ? v : null;
}

export function fromStroops(v: string | bigint): string {
  const n = BigInt(v);
  const whole = n / STROOPS;
  const frac = (n % STROOPS).toString().padStart(7, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

export interface CreateInput {
  members: string;
  amount: string;
  periodHours: string;
  graceHours: string;
}

export interface CreateParsed {
  members: string[];
  contribution: bigint;
  periodSeconds: number;
  graceSeconds: number;
}

export type Validation = { ok: true; value: CreateParsed } | { ok: false; errors: Partial<Record<keyof CreateInput, string>> };

export function validateCreate(input: CreateInput): Validation {
  const errors: Partial<Record<keyof CreateInput, string>> = {};
  const members = input.members.split(/[\s,]+/).filter(Boolean);
  if (members.length < 2 || members.length > 20) errors.members = "Enter between 2 and 20 Stellar addresses (one per line).";
  else if (members.some((m) => !StrKey.isValidEd25519PublicKey(m))) errors.members = "Each member must be a valid Stellar address starting with G.";
  else if (new Set(members).size !== members.length) errors.members = "Each member can only be listed once.";

  const contribution = toStroops(input.amount);
  if (contribution === null) errors.amount = "Enter a positive amount with at most 7 decimals.";

  const period = Number(input.periodHours);
  if (!Number.isFinite(period) || period * 3600 < MIN_PERIOD) errors.periodHours = "Each round must last at least 1 minute (0.02 hours).";
  else if (period > 24 * 366) errors.periodHours = "Each round can last at most one year.";

  const grace = Number(input.graceHours);
  if (!Number.isFinite(grace) || grace < 0) errors.graceHours = "Grace period must be 0 or more hours.";
  else if (Number.isFinite(period) && grace > period) errors.graceHours = "Grace period cannot be longer than a round.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: { members, contribution: contribution!, periodSeconds: Math.round(period * 3600), graceSeconds: Math.round(grace * 3600) },
  };
}
