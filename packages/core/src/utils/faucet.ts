import { Commitment, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { JsonRpcProvider } from 'ethers';
import { log } from './log';
import { delay } from './delay';
import { post } from './rest';
import { GasToken, GasTokenData } from '../models';

export class FaucetDropper {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async requestERC20(wallet: string, address_spl: string, amount: number): Promise<any> {
    return post(`${this.url}/request_erc20`, { amount, wallet, address_spl });
  }

  async requestNeon(wallet: string, amount: number): Promise<any> {
    try {
      return await post(`${this.url}/request_neon`, { amount, wallet });
    } catch (e) {
      return 0;
    }
  }
}

export async function neonAirdrop(provider: JsonRpcProvider, faucet: FaucetDropper, wallet: string, amount: number, tokenName: string = 'NEON', decimals = 18): Promise<bigint> {
  let balance = await provider.getBalance(wallet);
  if (balance < BigInt(amount) * BigInt(10 ** decimals)) {
    const requestAmount = amount > 100 ? 100 : amount;
    await faucet.requestNeon(wallet, requestAmount);
    await delay(4e3);
    return neonAirdrop(provider, faucet, wallet, amount, tokenName, decimals);
  }
  log(`${wallet} balance: ${balance / BigInt(10 ** decimals)} ${tokenName}`);
  return balance;
}

export async function solanaAirdrop(connection: Connection, publicKey: PublicKey, lamports: number, commitment: Commitment = 'finalized'): Promise<number> {
  let balance = await connection.getBalance(publicKey);
  if (balance < lamports) {
    const signature = await connection.requestAirdrop(publicKey, lamports);
    await connection.confirmTransaction(signature, commitment);
    balance = await connection.getBalance(publicKey);
  }
  log(`${publicKey.toBase58()} balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  return balance;
}
