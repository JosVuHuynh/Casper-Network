//import CasperClientService from './casperService.ts'
//import { CLPublicKey } from './PublicKey';
//import  CasperClientService from '../service/services'

import { Keys, CLPublicKey, CasperClient, DeployUtil } from 'casper-js-sdk';
//import {CLPublicKey} from '../service/CLPublicKey'
import {Ed25519, Secp256K1} from '../service/key'
const toUint8Array = require('base64-to-uint8array')
const RPC_API = "http://testnet-node.make.services:7777/rpc"
//const RPC_API = "https://node-clarity-mainnet.make.services/rpc"

const CHAIN_NAME_TESTNET = 'casper-test'
const CHAIN_NAME_MAINNET = 'casper'
const fs = require("fs");
const path = require("path");

const ED25519 = 'ed25519'
const SECP256K1 = 'secp256k1'

function getAccountHash(publicKey){
  return CLPublicKey.fromHex(publicKey).toAccountHashStr()
}

async function getBalance(publicKey){
  publicKey = "0154ea4fc131ea19fce97fa7a6447f58690e6c34922cd73d0a0b2243be55bacc45"
  const accountHash  = getAccountHash(publicKey)
  console.log("accoun hash is", accountHash)
  try {
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
    console.log("balance is", format(response.result.balance_value, 9))
    return format(response.result.balance_value, 9)
  } catch (error) {
    return 0 
  }

}

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

function onClick(){
    let casperClientService  = new CasperClientService(RPC_API)
    console.log("balance is", casperClientService.getBalance())
    //console.log("balance is",casperClientService.balanceOfByAccountHash("2a3c360a99a6f57d183b81c533eef7bcc9140d39c98d6454e10fd8d21a737ad0"))
}

function format(balance, decimal){
    return balance/(10**decimal)
}

async function getBalanceSDK(){
  
  let address = CLPublicKey.fromHex("014c8964d2a7425af35c3f0636b97261c5fc61ba8aeeeff3aeb9d60601276b1319")
  console.log("adddress is ", address);
  try{
    console.log("Hello")
    const casperClient = new CasperClient(RPC_API) 
    console.log("casperClient", casperClient)
        //const balance = await casperClient.balanceOfByPublicKey(address)

    //const balance = await casperClient.balanceOfByAccountHash("2a3c360a99a6f57d183b81c533eef7bcc9140d39c98d6454e10fd8d21a737ad0")
    const balance = await casperClient.balanceOfByAccountHash("cc29fb189de1bc5ca68835573648b47d51d20c5b698ce50a442fbbd785611eed")

    console.log("balance is ", balance)
    if (balance){
      console.log("get balance", format(balance.toNumber(),9));
      return format(balance.toNumber(),9)
    }
    //return 0 
  } catch (e) {
    console.log("error is", e)
    return 0 
  }

}

async function transfer(){
  let to = "0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca"
  let amount = "2500000000"
  const casperClient = new CasperClient(RPC_API);

    let privateKey = toUint8Array("MC4CAQAwBQYDK2VwBCIEIPqvmjS5sYLJChyhbZTbGuexgoA3+XrhWVT/uXAH0dCI")
    let publicKey = Uint8Array.from(Buffer.from("0154ea4fc131ea19fce97fa7a6447f58690e6c34922cd73d0a0b2243be55bacc45", 'hex'))

    // const signKeyPair = newKeyPair(ED25519)
    // console.log(edKeyPair)

    
    const signKeyPair = Keys.Ed25519.parseKeyPair(publicKey, privateKey)
    console.log(signKeyPair)
   
    // For native-transfers the payment price is fixed
    const paymentAmount = 10000000000;

    // transfer_id field in the request to tag the transaction and to correlate it to your back-end storage
    const id = 187821;

    // gasPrice for native transfers can be set to 1
    const gasPrice = 1;

    // Time that the deploy will remain valid for, in milliseconds
    // The default value is 1800000 ms (30 minutes)
    const ttl = 1800000;

    let deployParams = new DeployUtil.DeployParams(signKeyPair.publicKey, CHAIN_NAME_TESTNET, gasPrice, ttl);
    console.log("deploy param is", deployParams)

    // We create a public key from account-address (it is the hex representation of the public-key with an added prefix)
    const toPublicKey = CLPublicKey.fromHex(to);

    const session = DeployUtil.ExecutableDeployItem.newTransfer(amount, toPublicKey, null, id);
    console.log("session is", session)

    const payment = DeployUtil.standardPayment(paymentAmount);
    console.log("payment is",payment)

    const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
    console.log("deploy is", deploy)

    const signedDeploy = DeployUtil.signDeploy(deploy, signKeyPair);
    console.log("signedDeploy is", signedDeploy)
    // Here we are sending the signed deploy
    return await casperClient.putDeploy(signedDeploy);
}

function createAccountKeys(){
  // Generating keys
  const edKeyPair = Keys.Ed25519.new();
  console.log("key pair is", edKeyPair);
  const { publicKey, privateKey } = edKeyPair;

  // Get account-address from public key
  const accountAddress = publicKey.toHex();

  // Get account-hash (Uint8Array) from public key
  const accountHash = publicKey.toAccountHash();

  // Store keys as PEM files
  const publicKeyInPem = edKeyPair.exportPublicKeyInPem();
  const privateKeyInPem = edKeyPair.exportPrivateKeyInPem();

  
  // fs.writeFileSync("./" + accountAddress + "_public.pem", publicKeyInPem);
  // fs.writeFileSync( "./" + accountAddress + "_private.pem", privateKeyInPem);

  return accountAddress;
};


async function getHistory(publicKey, page, limit, order_direction, with_extended_info) {
    publicKey = "0154ea4fc131ea19fce97fa7a6447f58690e6c34922cd73d0a0b2243be55bacc45"
    const accountHash = getAccountHash(publicKey).slice(13)
    page = 1
    limit = 10
    order_direction = 'DESC'
    with_extended_info = 5
    const API_enpoint = 'https://event-store-api-clarity-testnet.make.services/accounts'
    const response = await (await fetch(`${API_enpoint}/${accountHash}/transfers?/page=${page}&limit=${limit}&order_direction=${order_direction}&with_extended_info=${with_extended_info}`)).json()
    console.log(response)
}

async function getNFT(){
  const API = 'https://casperpunks.io/api/nft'
  let response = await fetch(API,{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }  
  }).then((response) => response.json())
  console.log(response)
}

export default function Home() {

  return (
    <div >
      {/* <div onClick={onClick}>get balance</div> */}
      <div onClick={newKeyPair}>create new key</div>
      <br/>
      <div onClick={getBalance}>get balance</div>
      <br/>
      <div onClick={getHistory}>history</div>
      <br/>
      <div onClick={transfer}>transfer</div>
      <br/>
      <div onClick={getNFT}> get NFT</div>
    </div>
  )
}
