import { describe, it, expect } from "vitest";
import { Keypair } from "@stellar/stellar-sdk";
import { toStroops, fromStroops, validateCreate } from "../lib/validation";

const addrs = (n: number) => Array.from({ length: n }, () => Keypair.random().publicKey());
const base = { members: addrs(3).join("\n"), amount: "10", periodHours: "24", graceHours: "2" };

describe("amounts", () => {
  it("converts to stroops", () => {
    expect(toStroops("1")).toBe(10_000_000n);
    expect(toStroops("0.0000001")).toBe(1n);
    expect(toStroops("12.5")).toBe(125_000_000n);
  });
  it("rejects bad input", () => {
    for (const bad of ["", "0", "-1", "1.00000001", "abc", "1e3", "1,5"]) expect(toStroops(bad)).toBeNull();
  });
  it("round-trips", () => {
    expect(fromStroops(toStroops("12.5")!)).toBe("12.5");
    expect(fromStroops("10000000")).toBe("1");
  });
});

describe("validateCreate", () => {
  it("accepts a valid form", () => {
    const r = validateCreate(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toMatchObject({ contribution: 100_000_000n, periodSeconds: 86400, graceSeconds: 7200 });
  });
  it("rejects too few, duplicate and invalid members", () => {
    expect(validateCreate({ ...base, members: addrs(1)[0]! })).toMatchObject({ ok: false });
    const a = addrs(2)[0]!;
    expect(validateCreate({ ...base, members: `${a}\n${a}` })).toMatchObject({ ok: false, errors: { members: expect.stringContaining("once") } });
    expect(validateCreate({ ...base, members: "foo\nbar" })).toMatchObject({ ok: false, errors: { members: expect.stringContaining("valid") } });
    expect(validateCreate({ ...base, members: addrs(21).join(" ") })).toMatchObject({ ok: false });
  });
  it("enforces period and grace bounds", () => {
    expect(validateCreate({ ...base, periodHours: "0.001" })).toMatchObject({ ok: false });
    expect(validateCreate({ ...base, periodHours: "0.02", graceHours: "0" }).ok).toBe(true);
    expect(validateCreate({ ...base, graceHours: "25" })).toMatchObject({ ok: false });
    expect(validateCreate({ ...base, graceHours: "-1" })).toMatchObject({ ok: false });
  });
  it("rejects a zero amount", () => {
    expect(validateCreate({ ...base, amount: "0" })).toMatchObject({ ok: false, errors: { amount: expect.any(String) } });
  });
});
