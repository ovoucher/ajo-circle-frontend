import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { TxStatus } from "../components/TxStatus";
import type { Wallet } from "../services/wallet";
import type { RuntimeConfig } from "../lib/config";

const ADDR = "GC5P2CW2UTZMNH7DB4BNPULN3RZ3YC72YGMLXBR24X7EDKSMYCFG4YT7";
const wallet = (over: Partial<Wallet> = {}): Wallet => ({ connect: vi.fn(async () => ADDR), sign: vi.fn(async (x: string) => x), ...over });
const CFG: RuntimeConfig = {
  network: "testnet", rpcUrl: "https://rpc.example", networkPassphrase: "Test SDF Network ; September 2015",
  contractId: "CBLJTYZCAF6F3VW4JSU57S6ODYOXGAK5O3I3W55W2OZVSUXGCZTREZT5", tokenContractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", tokenSymbol: "XLM",
};
const loadConfig = async () => CFG;

describe("App shell", () => {
  it("shows the landing page with a visible Testnet badge", async () => {
    window.location.hash = "#/";
    render(<App wallet={wallet()} loadConfig={loadConfig} />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/savings circles/i);
    expect(screen.getByTitle(/only talks to Stellar Testnet/)).toHaveTextContent("Testnet");
  });
  it("connects and disconnects the wallet", async () => {
    render(<App wallet={wallet()} loadConfig={loadConfig} />);
    await userEvent.click(await screen.findByRole("button", { name: /connect freighter/i }));
    expect(await screen.findByText(/GC5P2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /disconnect/i }));
    expect(screen.getByRole("button", { name: /connect freighter/i })).toBeInTheDocument();
  });
  it("shows a human-readable error when connecting fails", async () => {
    render(<App loadConfig={loadConfig} wallet={wallet({ connect: vi.fn(async () => { throw new Error("Freighter is on \"PUBLIC\". Switch it to Testnet and try again."); }) })} />);
    await userEvent.click(await screen.findByRole("button", { name: /connect freighter/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Switch it to Testnet/);
  });
});

describe("Runtime config", () => {
  it("passes the Testnet passphrase from the backend to the wallet", async () => {
    window.location.hash = "#/";
    const w = wallet();
    render(<App wallet={w} loadConfig={loadConfig} />);
    await userEvent.click(await screen.findByRole("button", { name: /connect freighter/i }));
    expect(w.connect).toHaveBeenCalledWith(CFG.networkPassphrase);
  });
  it("shows a clear error with retry when the backend is unreachable", async () => {
    const failing = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValue(CFG);
    render(<App wallet={wallet()} loadConfig={failing} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Failed to fetch/);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/savings circles/i);
  });
});

describe("Create form", () => {
  it("blocks submission and shows validation errors", async () => {
    window.location.hash = "#/create";
    render(<App wallet={wallet()} loadConfig={loadConfig} />);
    await userEvent.click(await screen.findByRole("button", { name: /connect freighter/i }));
    await screen.findByText(/GC5P2/);
    await userEvent.click(screen.getByRole("button", { name: /create circle/i }));
    expect(await screen.findByText(/between 2 and 20/i)).toBeInTheDocument();
  });
  it("disables creation until a wallet is connected", async () => {
    window.location.hash = "#/create";
    render(<App wallet={wallet()} loadConfig={loadConfig} />);
    expect(await screen.findByRole("button", { name: /create circle/i })).toBeDisabled();
  });
});

describe("TxStatus", () => {
  const noop = () => {};
  it("renders nothing when idle", () => {
    const { container } = render(<TxStatus state={{ phase: "idle" }} onDismiss={noop} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("shows preview, pending, success and failure states", () => {
    const { rerender } = render(<TxStatus state={{ phase: "awaiting-signature", preview: "Join circle 3" }} onDismiss={noop} />);
    expect(screen.getByText(/Join circle 3/)).toBeInTheDocument();
    rerender(<TxStatus state={{ phase: "submitted", hash: "ab".repeat(32) }} onDismiss={noop} />);
    expect(screen.getByText(/Waiting for the network/)).toBeInTheDocument();
    expect(screen.queryByText(/Confirmed/)).toBeNull();
    rerender(<TxStatus state={{ phase: "confirmed", hash: "ab".repeat(32) }} onDismiss={noop} />);
    expect(screen.getByRole("link", { name: /stellar expert/i })).toHaveAttribute("href", expect.stringContaining("stellar.expert/explorer/testnet/tx/"));
    rerender(<TxStatus state={{ phase: "failed", message: "Nope" }} onDismiss={noop} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Nope");
  });
});
