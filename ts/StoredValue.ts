




export declare enum CLTypeTag {
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

declare class NamedKey {
    name: string;
    key: string;
}
declare class AssociatedKey {
    accountHash: string;
    weight: number;
}
declare class ActionThresholds {
    deployment: number;
    keyManagement: number;
}
/**
 * Structure representing a user's account, stored in global state.
 */
declare class AccountJson {
    accountHash(): string;
    private _accountHash;
    namedKeys: NamedKey[];
    mainPurse: string;
    associatedKeys: AssociatedKey[];
    actionThresholds: ActionThresholds;
}
export declare class TransferJson {
    deployHash: string;
    from: string;
    source: string;
    target: string;
    amount: string;
    gas: string;
    id: number | null;
}

export declare class Transfers {
    transfers: TransferJson[];
}

export declare class DeployInfoJson {
    deployHash: string;
    transfers: string[];
    from: string;
    source: string;
    gas: string;
}
/**
 * Info about a seigniorage allocation for a validator
 */
declare class Validator {
    validatorPublicKey: string;
    amount: string;
}
/**
 * Info about a seigniorage allocation for a delegator
 */
declare class Delegator {
    delegatorPublicKey: string;
    validatorPublicKey: string;
    amount: string;
}
/**
 * Information about a seigniorage allocation
 */
export declare class SeigniorageAllocation {
    Validator?: Validator;
    Delegator?: Delegator;
}
/**
 * Auction metadata. Intended to be recorded at each era.
 */
export declare class EraInfoJson {
    seigniorageAllocations: SeigniorageAllocation[];
}
/**
 * Named CLType arguments
 */
export declare class NamedCLTypeArg {
    name: string;
    clType: CLType;
}
/**
 * Entry point metadata
 */
export declare class EntryPoint {
    access: string;
    entryPointType: string;
    name: string;
    ret: string;
    args: NamedCLTypeArg[];
}
/**
 * Contract metadata.
 */
export declare class ContractMetadataJson {
    contractPackageHash: string;
    contractWasmHash: string;
    entrypoints: EntryPoint[];
    protocolVersion: string;
    namedKeys: NamedKey[];
}
/**
 * Contract Version.
 */
export declare class ContractVersionJson {
    protocolVersionMajor: number;
    contractVersion: number;
    contractHash: string;
}
/**
 * Disabled Version.
 */
export declare class DisabledVersionJson {
    accessKey: number;
    contractVersion: number;
}
/**
 * Groups.
 */
export declare class GroupsJson {
    group: string;
    keys: string;
}
/**
 * Contract Package.
 */
export declare class ContractPackageJson {
    accessKey: string;
    versions: ContractVersionJson[];
    disabledVersions: DisabledVersionJson[];
    groups: GroupsJson[];
}

export declare abstract class CLType {
    abstract toString(): string;
    abstract toJSON(): any;
    abstract linksTo: any;
    abstract tag: CLTypeTag;
    toBytes(): Uint8Array;
}

export declare abstract class CLValue {
    isCLValue: boolean;
    abstract clType(): CLType;
    abstract value(): any;
    abstract data: any;
}

export declare class StoredValue {
    CLValue?: CLValue;
    Account?: AccountJson;
    ContractWASM?: string;
    Contract?: ContractMetadataJson;
    ContractPackage?: ContractPackageJson;
    Transfer?: TransferJson;
    DeployInfo?: DeployInfoJson;
    EraInfo?: EraInfoJson;
}
export {};
