import { describe, it, expect, vi } from "vitest";
import { Account, Keypair, Networks, Operation, TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import { runContractCall, friendlyError, u32, type TxState } from "../lib/tx";

const kp = Keypair.random();
const CONTRACT = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const PASS = "Test SDF Network ; September 2015";
const call = { method: "join", args: [u32(0)], preview: "Join circle 0" };

function tx() {
  return new TransactionBuilder(new Account(kp.publicKey(), "1"), { fee: "100", networkPassphrase: PASS })
    .addOperation(Operation.bumpSequence({ bumpTo: "5" })).setTimeout(30).build();
}

function setup(statuses: string[], send: { status: string; hash: string } = { status: "PENDING", hash: "h".repeat(64) }) {
  const states: TxState[] = [];
  const queue = [...statuses];
  const server = {
    getAccount: vi.fn(async () => new Account(kp.publicKey(), "1")),
    prepareTransaction: vi.fn(async () => tx()),
    sendTransaction: vi.fn(async () => send),
    getTransaction: vi.fn(async () => ({ status: queue.shift() ?? "NOT_FOUND" })),
  };
  const sign = vi.fn(async (x: string) => x);
  const onVerified = vi.fn();
  return { states, server, sign, onVerified, run: () => runContractCall(kp.publicKey(), call, (s) => states.push(s), { server: server as never, sign, onVerified, sleep: async () => {} }, { contractId: CONTRACT, networkPassphrase: PASS, rpcUrl: "http://unused" }) };
}

describe("runContractCall", () => {
  it("only reports confirmed after the network reports SUCCESS", async () => {
    const t = setup([rpc.Api.GetTransactionStatus.NOT_FOUND, rpc.Api.GetTransactionStatus.SUCCESS]);
    expect(await t.run()).toBe(true);
    expect(t.states.map((s) => s.phase)).toEqual(["preparing", "awaiting-signature", "submitted", "confirmed"]);
    expect(t.onVerified).toHaveBeenCalledOnce();
  });
  it("shows the preview before asking for a signature", async () => {
    const t = setup([rpc.Api.GetTransactionStatus.SUCCESS]);
    await t.run();
    expect(t.states[1]).toEqual({ phase: "awaiting-signature", preview: "Join circle 0" });
  });
  it("never reports success when the transaction fails on-chain", async () => {
    const t = setup([rpc.Api.GetTransactionStatus.FAILED]);
    expect(await t.run()).toBe(false);
    expect(t.states.some((s) => s.phase === "confirmed")).toBe(false);
    expect(t.states.at(-1)).toMatchObject({ phase: "failed" });
    expect(t.onVerified).not.toHaveBeenCalled();
  });
  it("fails before signing when simulation is rejected", async () => {
    const t = setup([]);
    t.server.prepareTransaction.mockRejectedValue(new Error("HostError: Error(Contract, #12)"));
    expect(await t.run()).toBe(false);
    expect(t.sign).not.toHaveBeenCalled();
    expect(t.states.at(-1)).toMatchObject({ phase: "failed", message: "You already paid this round." });
  });
  it("handles a declined signature", async () => {
    const t = setup([]);
    t.sign.mockRejectedValue(new Error("User declined access"));
    expect(await t.run()).toBe(false);
    expect(t.states.at(-1)).toMatchObject({ message: "You declined the request in your wallet." });
    expect(t.server.sendTransaction).not.toHaveBeenCalled();
  });
  it("fails when the network rejects submission", async () => {
    const t = setup([], { status: "ERROR", hash: "x" });
    expect(await t.run()).toBe(false);
  });
  it("times out instead of claiming success", async () => {
    const t = setup([]);
    expect(await t.run()).toBe(false);
    expect(t.states.at(-1)).toMatchObject({ phase: "failed", message: expect.stringContaining("Timed out") });
  });
  it("still confirms if backend indexing fails", async () => {
    const t = setup([rpc.Api.GetTransactionStatus.SUCCESS]);
    t.onVerified.mockRejectedValue(new Error("backend down"));
    expect(await t.run()).toBe(true);
  });
});

describe("friendlyError", () => {
  it("maps contract errors and passes through unknown ones", () => {
    expect(friendlyError(new Error("Error(Contract, #14)"))).toContain("cannot be settled");
    expect(friendlyError(new Error("boom"))).toBe("boom");
  });
});

void Networks;
