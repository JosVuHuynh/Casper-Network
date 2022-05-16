import { CLPublicKey } from "./CLPublicKey"
import * as nacl from 'tweetnacl-ts';
import eccrypto from 'eccrypto';

const ED25519 = 'ed25519'
const SECP256K1 = 'secp256k1'

export class Ed25519 {
    constructor(keyPair){
        this.publicKey = new CLPublicKey(keyPair.publicKey, ED25519)
        this.privateKey = keyPair.secretKey
    }

    /**
   * Generating a new Ed25519 key pair
   */
    static new() {
        return new Ed25519(nacl.sign_keyPair());
    }

    static parsePrivateKey(bytes) {
        return Ed25519.parseKey(bytes, 0, 32);
    }

    static parsePublicKey(bytes) {
        return Ed25519.parseKey(bytes, 32, 64);
    }

    static parseKey(bytes, from, to) {
        const len = bytes.length;
        // prettier-ignore
        const key =
        (len === 32) ? bytes :
            (len === 64) ? Buffer.from(bytes).slice(from, to) :
            (len > 32 && len < 64) ? Buffer.from(bytes).slice(len % 32) :
                null;

        if (key == null || key.length !== 32) {
        throw Error(`Unexpected key length: ${len}`);
        }
        return key;
    }

      /**
   * Construct keyPair from a public key and private key
   * @param publicKey
   * @param privateKey
   */
    static parseKeyPair(publicKey, privateKey) {
        const publ = Ed25519.parsePublicKey(publicKey);
        const priv = Ed25519.parsePrivateKey(privateKey);
        // nacl expects that the private key will contain both.
        const secr = new Uint8Array(publ.length + priv.length);
        secr.set(priv);
        secr.set(publ, priv.length);
        return new Ed25519({
            publicKey: publ,
            secretKey: secr
        });
    }

}

export class Secp256K1 {
    constructor(keyPair){
        this.publicKey = new CLPublicKey(keyPair.publicKey, SECP256K1)
        this.privateKey = keyPair.secretKey
    }

    /**
   * Generating a new Secp256K1 key pair
   */
    static new() {
        const privateKey = eccrypto.generatePrivate();
        const publicKey = Uint8Array.from(eccrypto.getPublicCompressed(privateKey));
        return new Secp256K1(publicKey, privateKey);
      }

   
}