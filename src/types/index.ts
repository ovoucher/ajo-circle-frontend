export interface CircleView {
  organizer: string;
  token: string;
  members: string[];
  contribution: string;
  period: number;
  grace: number;
  state: "Forming" | "Active" | "Completed" | "Cancelled";
  joined: number;
  startTime: number;
  round: number;
  paid: number;
}

export interface CircleRecord {
  id: number;
  /** Read from the contract. */
  onChain: CircleView;
  /** Stored by the backend, signed by the organizer; not on-chain. */
  offChain: { name: string; description: string } | null;
}

export interface CircleEvent {
  id: string;
  ledger: number;
  txHash: string;
  type: string;
  data: Record<string, unknown>;
}
