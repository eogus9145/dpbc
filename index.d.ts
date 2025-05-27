/// <reference types="node" />

interface ProtocolField {
    name: string;
    type: string;
    nullable?: boolean;
}

interface Protocol {
    name: string;
    fields: ProtocolField[];
}

declare class DPBC {
    protocol: Protocol | null;

    constructor();

    /**
     * Sets the protocol by loading a JSON file path.
     * @param protocolJsonPath Path to the JSON protocol definition file.
     */
    setProtocol(protocolJsonPath?: string): Promise<void>;

    /**
     * Encode the given target object to a Buffer according to the protocol if set,
     * or JSON string buffer if no protocol.
     * @param target Object to encode.
     * @returns Encoded Buffer.
     */
    encode(target: any): Buffer;

    /**
     * Decode the given Buffer to an object according to the protocol if set,
     * or JSON parse if no protocol.
     * @param target Buffer to decode.
     * @returns Decoded object.
     */
    decode(target: Buffer): any;
}

export = DPBC;
