import blake from 'blakejs';
import { Logger } from "@ethersproject/logger";
export const version = "bytes/5.1.0";
const logger = new Logger(version);
const ED25519_LENGTH = 32;
const SECP256K1_LENGTH = 33;
export const PUBLIC_KEY_ID = 'PublicKey';
export type Bytes = ArrayLike<number>;

export type BytesLike = Bytes | string;

/**
 * Casper types, i.e. types which can be stored and manipulated by smart contracts.
 *
 * Provides a description of the underlying data type of a [[CLValue]].
 */
 export enum CLTypeTag {
    /** A boolean value */
    Bool = 0,
    /** A 32-bit signed integer */
    I32 = 1,
    /** A 64-bit signed integer */
    I64 = 2,
    /** An 8-bit unsigned integer (a byte) */
    U8 = 3,
    /** A 32-bit unsigned integer */
    U32 = 4,
    /** A 64-bit unsigned integer */
    U64 = 5,
    /** A 128-bit unsigned integer */
    U128 = 6,
    /** A 256-bit unsigned integer */
    U256 = 7,
    /** A 512-bit unsigned integer */
    U512 = 8,
    /** A unit type, i.e. type with no values (analogous to `void` in C and `()` in Rust) */
    Unit = 9,
    /** A string of characters */
    String = 10,
    /** A key in the global state - URef/hash/etc. */
    Key = 11,
    /** An Unforgeable Reference (URef) */
    URef = 12,
    /** An [[Option]], i.e. a type that can contain a value or nothing at all */
    Option = 13,
    /** A list of values */
    List = 14,
    /** A fixed-length array of bytes */
    ByteArray = 15,
    /**
     * A [[Result]], i.e. a type that can contain either a value representing success or one representing failure.
     */
    Result = 16,
    /** A key-value map. */
    Map = 17,
    /** A 1-value tuple. */
    Tuple1 = 18,
    /** A 2-value tuple, i.e. a pair of values. */
    Tuple2 = 19,
    /** A 3-value tuple. */
    Tuple3 = 20,
    /** A value of any type. */
    Any = 21,
    /** A value of public key type. */
    PublicKey = 22
  }

  export abstract class CLType {
    abstract toString(): string;
    abstract toJSON(): any;
    abstract linksTo: any;
    abstract tag: CLTypeTag;
  
    toBytes(): Uint8Array {
      return Uint8Array.from([this.tag]);
    }
  }
  
  export abstract class CLValue {
    isCLValue = true;
    abstract clType(): CLType;
    abstract value(): any;
    abstract data: any;
  }

  export enum CLPublicKeyTag {
    ED25519 = 1,
    SECP256K1 = 2
  }

  /**
 * Supported types of Asymmetric Key algorithm
 */
export enum SignatureAlgorithm {
    Ed25519 = 'ed25519',
    Secp256K1 = 'secp256k1'
  }


  export class CLPublicKeyType extends CLType {
    linksTo = CLPublicKey;
    tag = CLTypeTag.PublicKey;
  
    toString(): string {
      return PUBLIC_KEY_ID;
    }
  
    toJSON(): string {
      return this.toString();
    }
  }
/**
 * Encode Uint8Array into string using Base-16 encoding.
 */
 export function encodeBase16(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
  }

  /**
 * Decode Base-16 encoded string and returns Uint8Array of bytes.
 *
 * @param base16String base16 encoded string
 */
export function decodeBase16(base16String: string): Uint8Array {
    return new Uint8Array(Buffer.from(base16String, 'hex'));
  }

export interface Hexable {
    toHexString(): string;
}


/**
 * Use blake2b to compute hash of ByteArray
 *
 * @param x
 */
 export function byteHash(x: Uint8Array): Uint8Array {
    return blake.blake2b(x, null, 32);
  }
  
  function isHexable(value: any): value is Hexable {
    return !!(value.toHexString);
}

export function isHexString(value: any, length?: number): boolean {
    if (typeof(value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false
    }
    if (length && value.length !== 2 + 2 * length) { return false; }
    return true;
}

export type DataOptions = {
    allowMissingPrefix?: boolean;
    hexPad?: "left" | "right" | null;
};

export function isBytes(value: any): value is Bytes {
    if (value == null) { return false; }

    if (value.constructor === Uint8Array) { return true; }
    if (typeof(value) === "string") { return false; }
    if (value.length == null) { return false; }

    for (let i = 0; i < value.length; i++) {
        const v = value[i];
        if (typeof(v) !== "number" || v < 0 || v >= 256 || (v % 1)) {
            return false;
        }
    }
    return true;
}

  export function arrayify(value: BytesLike | Hexable | number, options?: DataOptions): Uint8Array {
    if (!options) { options = { }; }

    if (typeof(value) === "number") {
        logger.checkSafeUint53(value, "invalid arrayify value");

        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value = parseInt(String(value / 256));
        }
        if (result.length === 0) { result.push(0); }

        return addSlice(new Uint8Array(result));
    }

    if (options.allowMissingPrefix && typeof(value) === "string" && value.substring(0, 2) !== "0x") {
         value = "0x" + value;
    }

    if (isHexable(value)) { value = value.toHexString(); }

    if (isHexString(value)) {
        let hex = (<string>value).substring(2);
        if (hex.length % 2) {
            if (options.hexPad === "left") {
                hex = "0x0" + hex.substring(2);
            } else if (options.hexPad === "right") {
                hex += "0";
            } else {
                logger.throwArgumentError("hex data is odd-length", "value", value);
            }
        }

        const result = [];
        for (let i = 0; i < hex.length; i += 2) {
            result.push(parseInt(hex.substring(i, i + 2), 16));
        }

        return addSlice(new Uint8Array(result));
    }

    if (isBytes(value)) {
        return addSlice(new Uint8Array(value));
    }

    return logger.throwArgumentError("invalid arrayify value", "value", value);
}

function addSlice(array: Uint8Array): Uint8Array {
    if (array.slice) { return array; }

    array.slice = function() {
        const args = Array.prototype.slice.call(arguments);
        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
    }

    return array;
}

export function concat(items: ReadonlyArray<BytesLike>): Uint8Array {
    const objects = items.map(item => arrayify(item));
    const length = objects.reduce((accum, item) => (accum + item.length), 0);

    const result = new Uint8Array(length);

    objects.reduce((offset, object) => {
        result.set(object, offset);
        return offset + object.length;
    }, 0);

    return addSlice(result);
}

export class CLPublicKey extends CLValue {
    data: Uint8Array;
    tag: CLPublicKeyTag;
  
    constructor(
      rawPublicKey: Uint8Array,
      tag: CLPublicKeyTag | SignatureAlgorithm
    ) {
      super();
      // TODO: Two ifs because of the legacy indentifiers in ./Keys
      if (tag === CLPublicKeyTag.ED25519 || tag === SignatureAlgorithm.Ed25519) {
        if (rawPublicKey.length !== ED25519_LENGTH) {
          throw new Error(
            `Wrong length of ED25519 key. Expected ${ED25519_LENGTH}, but got ${rawPublicKey.length}.`
          );
        }
        this.data = rawPublicKey;
        this.tag = CLPublicKeyTag.ED25519;
        return;
      }
      if (
        tag === CLPublicKeyTag.SECP256K1 ||
        tag === SignatureAlgorithm.Secp256K1
      ) {
        if (rawPublicKey.length !== SECP256K1_LENGTH) {
          throw new Error(
            `Wrong length of SECP256K1 key. Expected ${SECP256K1_LENGTH}, but got ${rawPublicKey.length}.`
          );
        }
        this.data = rawPublicKey;
        this.tag = CLPublicKeyTag.SECP256K1;
        return;
      }
      throw new Error('Unsupported type of public key');
    }
  
    clType(): CLType {
      return new CLPublicKeyType();
    }
  
    // isEd25519(): boolean {
    //   return this.tag === CLPublicKeyTag.ED25519;
    // }
  
    // isSecp256K1(): boolean {
    //   return this.tag === CLPublicKeyTag.SECP256K1;
    // }
  
    // toHex(): string {
    //   return `0${this.tag}${encodeBase16(this.data)}`;
    // }
 
    toAccountHash(): Uint8Array {
        const algorithmIdentifier = CLPublicKeyTag[this.tag];
        const separator = Uint8Array.from([0]);
        const prefix = Buffer.concat([
          Buffer.from(algorithmIdentifier.toLowerCase()),
          separator
        ]);
    
        if (this.data.length === 0) {
          return Uint8Array.from([]);
        } else {
          return byteHash(concat([prefix, this.data]));
        }
      }

    value(): Uint8Array {
      return this.data;
    }
  
    // static fromEd25519(publicKey: Uint8Array): CLPublicKey {
    //   return new CLPublicKey(publicKey, CLPublicKeyTag.ED25519);
    // }
  
    // static fromSecp256K1(publicKey: Uint8Array): CLPublicKey {
    //   return new CLPublicKey(publicKey, CLPublicKeyTag.SECP256K1);
    // }
  
    /**
     * Tries to decode PublicKey from its hex-representation.
     * The hex format should be as produced by PublicKey.toAccountHex
     * @param publicKeyHex
     */
    static fromHex(publicKeyHex: string): CLPublicKey {
      if (publicKeyHex.length < 2) {
        throw new Error('Asymmetric key error: too short');
      }
      if (!/^0(1[0-9a-fA-F]{64}|2[0-9a-fA-F]{66})$/.test(publicKeyHex)) {
        throw new Error('Invalid public key');
      }
      const publicKeyHexBytes = decodeBase16(publicKeyHex);
  
      return new CLPublicKey(publicKeyHexBytes.subarray(1), publicKeyHexBytes[0]);
    }
  }
  