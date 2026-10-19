import { getNetworkDetails, isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";

export interface Wallet {
  connect(networkPassphrase: string): Promise<string>;
  sign(xdr: string, address: string, networkPassphrase: string): Promise<string>;
}

export const freighter: Wallet = {
  async connect(networkPassphrase) {
    const conn = await isConnected();
    if (!conn.isConnected) throw new Error("Freighter not found. Install the Freighter browser extension and reload.");
    const access = await requestAccess();
    if (access.error) throw new Error(access.error.message ?? "Wallet access was declined.");
    const net = await getNetworkDetails();
    if (net.networkPassphrase !== networkPassphrase) {
      throw new Error(`Freighter is on "${net.network}". Switch it to Testnet and try again.`);
    }
    return access.address;
  },
  async sign(xdr, address, networkPassphrase) {
    const res = await signTransaction(xdr, { networkPassphrase, address });
    if (res.error) throw new Error(res.error.message ?? "Signature was declined.");
    return res.signedTxXdr;
  },
};
