const path = require('path');
const DPBC = require('dpbc');

const main = async () => {
    const codec = new DPBC();

    const protocolJsonPath = path.join(__dirname, "protocol.json") // Your Protocol Definition File Path.
    
    // Adds a protocol to the protocol list, but does not use it yet
    await codec.addProtocol(protocolJsonPath);
    console.log("codec.protocolList : ", codec.protocolList);

    // Delete a protocol with the same name as the parameter from the protocol list. If the protocol is currently in use, disable it.
    codec.deleteProtocol('TestProtocol');
    console.log("codec.protocolList : ", codec.protocolList);

    // After adding the protocol again, I try to print out the protocol I'm currently using to the console, but I'm not using it yet, so I return null.
    await codec.addProtocol(protocolJsonPath);
    console.log("codec.protocol : ", codec.protocol);

    // Specify the protocol to be used and print it out to the console to check.
    codec.useProtocol('TestProtocol');
    console.log("codec.protocol : ", codec.protocol);

    //Raw data in the same format as protocol
    const param = { 
        int: 1234,
        str: 'abcd',
        arr: ['a', 'b', 'c', 'd'],
        obj: {name: "jack", age: 20}
    };

    // After setting whether it is a request or a response, encode it in the same format as the protocol.
    const encodedData = codec.request().encode(param);
    console.log("encodedData : ", encodedData);
    // <Buffer 7b 22 69 6e 74 22 3a 31 32 33 34 2c 22 73 74 72 22 3a 22 61 62 63 64 22 2c 22 61 72 72 22 3a 5b 22 61 22 2c 22 62 22 2c 22 63 22 2c 22 64 22 5d 2c 22 ... 30 more bytes>

    // Decoding in the same format as the protocol.
    const decodedData = codec.request().decode(encodedData);
    console.log("decodedData : ", decodedData);
    // {
    //   int: 1234,
    //   str: 'abcd',
    //   arr: [ 'a', 'b', 'c', 'd' ],
    //   obj: { name: 'jack', age: 20 }
    // }
}

main();