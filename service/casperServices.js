import {CLPublicKey} from './CLPublicKey'
import {Ed25519, Secp256K1} from './key'

const RPC_API = "http://testnet-node.make.services:7777/rpc"
const RPC_API_MAINNET ="https://node-clarity-mainnet.make.services/rpc"
const API_accounts = 'https://event-store-api-clarity-testnet.make.services/accounts'
const API_Info_get_status = 'https://event-store-api-clarity-testnet.make.services/rpc/info_get_status'
const ED25519 = 'ed25519'
const SECP256K1 = 'secp256k1'


function newKeyPair(algorithm) {
    const  edKeyPair = Ed25519.new();
    switch (algorithm) {
      case ED25519:
        return Ed25519.new();
      case SECP256K1:
        return Secp256K1.new();
      default:
        throw new Error('Invalid signature algorithm');
    }
    return edKeyPair
}

async function getBalance(publicKey){
    const accountHash  = getAccountHash(publicKey)
    let body_get_latest_root_hash = {
      id: "1",
      jsonrpc: "2.0",
      method: "chain_get_block"
    }
  
    let latest_block = await fetch(RPC_API,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body_get_latest_root_hash)
    }).then((response) => response.json())
  
    let state_root_hash = latest_block.result.block.header.state_root_hash
    let body_get_block_state = {
      id: "1",
      jsonrpc: "2.0",
      method: "state_get_item",
      params: {
        key:  accountHash,
        path: [],
        state_root_hash: state_root_hash
      }
    }
  
    let block_state_response = await fetch(RPC_API,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body_get_block_state)
    }).then((response) => response.json())
    let main_purse = block_state_response.result.stored_value.Account.main_purse;
    let data = {
        id: '2',
        jsonrpc: '2.0',
        method: 'state_get_balance',
        params:{
            purse_uref: main_purse,
            state_root_hash: state_root_hash
        }
    }
  
    let response = await fetch(RPC_API,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).then((response) => response.json())
  
    return format(response.result.balance_value, 9)
}

async function getHistory(publicKey, page, limit, order_direction, with_extended_info) {
    const accountHash = getAccountHash(publicKey).slice(13)
    const response = await (await fetch(`${API_accounts}/${accountHash}/transfers?/page=${page}&limit=${limit}&order_direction=${order_direction}&with_extended_info=${with_extended_info}`)).json()
    return response
}


function format(balance, decimal){
    return balance/(10**decimal)
}

function getAccountHash(publicKey){
    return CLPublicKey.fromHex(publicKey).toAccountHashStr()
}
