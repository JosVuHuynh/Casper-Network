import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';
import { BigNumber } from '@ethersproject/bignumber';
import { TypedJSON } from 'typedjson';
import ProviderTransport, { SafeEventEmitterProvider } from './ProviderTransport';
import { StoredValue } from './StoredValue';
import { CLPublicKey } from './PublicKey';
//import {CLPublicKey} from 'casper-js-sdk/dist/lib/CLValue/PublicKey'
type JsonBlockHash = string;

interface RpcResult {
  api_version: string;
}

export interface JsonHeader {
  parent_hash: string;
  state_root_hash: string;
  body_hash: string;
  deploy_hashes: string[];
  random_bit: boolean;
  switch_block: boolean;
  timestamp: number;
  system_transactions: JsonSystemTransaction[];
  era_id: number;
  height: number;
  proposer: string;
  protocol_version: string;
}

export interface JsonSystemTransaction {
  Slash?: string;
  Reward?: Record<string, number>;
}


export interface GetBlockResult extends RpcResult {
  block: JsonBlock | null;
}

export interface JsonBlock {
  hash: JsonBlockHash;
  header: JsonHeader;
  proofs: string[];
}


export default class CasperClientService{

    public client: Client
    
    constructor(provider: string | SafeEventEmitterProvider) {
      let transport: HTTPTransport | ProviderTransport;
      if (typeof provider === 'string') {
        transport = new HTTPTransport(provider);
      } else {
        transport = new ProviderTransport(provider);
      }
      let requestManager = new RequestManager([transport]);
      console.log("request manager is", requestManager)
      this.client = new Client(requestManager);
      console.log("client is",this.client)
      console.log("provider is",provider)
    }

    
    encodeBase16(bytes: Uint8Array): string {
      return Buffer.from(bytes).toString('hex');
    }

    public async balanceOfByPublicKey(
        publicKey: CLPublicKey
    ): Promise<BigNumber> {
        console.log(publicKey)
        return this.balanceOfByAccountHash(this.encodeBase16(publicKey.toAccountHash()));
    }

  public async balanceOfByAccountHash(
    accountHashStr: string
  ): Promise<BigNumber> {
    try {
      const stateRootHash = await this
        .getLatestBlockInfo()
        .then(it => it.block?.header.state_root_hash);
      // Find the balance Uref and cache it if we don't have it.
      console.log("stateRootHash is aa", stateRootHash, "accountHashStr is", accountHashStr)
      if (!stateRootHash) {
        return BigNumber.from(0);
      }
      const balanceUref = await this.getAccountBalanceUrefByPublicKeyHash(
        stateRootHash,
        accountHashStr
      );
       
      console.log("balanceUref", balanceUref)
      if (!balanceUref) {
        return BigNumber.from(0);
      }

      return await this.getAccountBalance(
        stateRootHash,
        balanceUref
      );
    } catch (e) {
      return BigNumber.from(0);
    }
  }

  public async getLatestBlockInfo(): Promise<GetBlockResult> {
    return await this.client.request({
      method: 'chain_get_block'
    });
  }

    /**
   * Get the reference to the balance so we can cache it.
   */
     public async getAccountBalanceUrefByPublicKeyHash(
      stateRootHash: string,
      accountHash: string
    ) {
      const account = await this.getBlockState(
        stateRootHash,
        'account-hash-' + accountHash,
        []
      ).then(res => res.Account!);
      console.log(account)
      return account.mainPurse;
    }


     /**
   * get global state item
   * @param stateRootHash
   * @param key
   * @param path
   */
  public async getBlockState(
    stateRootHash: string,
    key: string,
    path: string[]
  ): Promise<StoredValue> {
    const res = await this.client.request({
      method: 'state_get_item',
      params: {
        state_root_hash: stateRootHash,
        key,
        path
      }
    });
    if (res.error) {
      return res;
    } else {
      const storedValueJson = res.stored_value;
      const serializer = new TypedJSON(StoredValue);
      const storedValue = serializer.parse(storedValueJson)!;
      return storedValue;
    }
  }

  public async getAccountBalance(
    stateRootHash: string,
    balanceUref: string
  ): Promise<BigNumber> {
    return await this.client
      .request({
        method: 'state_get_balance',
        params: {
          state_root_hash: stateRootHash,
          purse_uref: balanceUref
        }
      })
      .then(res => BigNumber.from(res.balance_value));
  }

}