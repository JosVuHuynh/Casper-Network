import { concat } from '@ethersproject/bytes';
import blake from 'blakejs';

const ED25519_LENGTH = 32;
const SECP256K1_LENGTH = 33;

const   ED25519 = 1
const   SECP256K1 = 2

const  Ed25519 = 'ed25519'
const  Secp256K1 = 'secp256k1'

export class CLPublicKey {
  constructor(
    rawPublicKey,
    tag
  ) {
   
    // TODO: Two ifs because of the legacy indentifiers in ./Keys
    if (tag === ED25519 || tag === Ed25519) {
      if (rawPublicKey.length !== ED25519_LENGTH) {
        throw new Error(
          `Wrong length of ED25519 key. Expected ${ED25519_LENGTH}, but got ${rawPublicKey.length}.`
        );
      }
      this.data = rawPublicKey;
      this.tag = ED25519;
      return;
    }
    if (
      tag === SECP256K1 ||
      tag === Secp256K1
    ) {
      if (rawPublicKey.length !== SECP256K1_LENGTH) {
        throw new Error(
          `Wrong length of SECP256K1 key. Expected ${SECP256K1_LENGTH}, but got ${rawPublicKey.length}.`
        );
      }
      this.data = rawPublicKey;
      this.tag =  SECP256K1;
      return;
    }
    throw new Error('Unsupported type of public key');
  }

  toAccountHash() {
    let algorithmIdentifier;
    if (this.tag == 1){
      algorithmIdentifier = 'ed25519'
    } else if (this.tag == 2){
      algorithmIdentifier = 'secp256k1'
    }

    const separator = Uint8Array.from([0]);
    const prefix = Buffer.concat([
      Buffer.from(algorithmIdentifier.toLowerCase()),
      separator
    ]);

    if (this.data.length === 0) {
      return Uint8Array.from([]);
    } else {
      return this.byteHash(concat([prefix, this.data]));
    }
  }

  toAccountHashStr() {
    const bytes = this.toAccountHash();
    const hashHex = Buffer.from(bytes).toString('hex');
    return `account-hash-${hashHex}`;
  }

  toHex() {
    return `0${this.tag}${this.encodeBase16(this.data)}`;
  }

  /**
   * Tries to decode PublicKey from its hex-representation.
   * The hex format should be as produced by PublicKey.toAccountHex
   * @param publicKeyHex
   */
  static fromHex(publicKeyHex) {
    if (publicKeyHex.length < 2) {
      throw new Error('Asymmetric key error: too short');
    }
    if (!/^0(1[0-9a-fA-F]{64}|2[0-9a-fA-F]{66})$/.test(publicKeyHex)) {
      throw new Error('Invalid public key');
    }
    const publicKeyHexBytes = CLPublicKey.decodeBase16(publicKeyHex);
    return new CLPublicKey(publicKeyHexBytes.subarray(1), publicKeyHexBytes[0]);
  }

  static decodeBase16(base16String) {
    return new Uint8Array(Buffer.from(base16String, 'hex'));
  }

  byteHash(x) {
    return blake.blake2b(x, null, 32);
  }

  encodeBase16(bytes) {
    return Buffer.from(bytes).toString('hex');
  }

}
