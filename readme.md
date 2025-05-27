# DPBC(Daehyun's Protocol Binary Codec)

> A protocol-based binary codec that can encode and decode objects, strings, and numbers to and from binary format.


## Install

```
$ npm install dpbc
```

## Define your own protocol as json file
```json
{
    "name": "testProtocol",
    "fields": [
        { "name": "int", "type": "int32" },
        { "name": "str", "type": "string" },
        { "name": "arr", "type": "array", "nullable": true },
        { "name": "obj", "type": "object", "nullable": true }
    ]
}
```

## Usage

```js
const path = require('path');
const DPBC = require('dpbc');

const dpbc = new DPBC();

const protocolJsonPath = path.join(__dirname, "protocol.json") // Your Protocol Definition File Path.
await dpbc.setProtocol(protocolJsonPath);

const param = { //Raw data in the same format as protocol
    int: 1234,
    str: 'abcd',
    arr: ['a', 'b', 'c', 'd'],
    obj: {name: "jack", age: 20}
}

// Encode in the same format as the protocol.
const encodedData = dpbc.encode(param);
console.log(encodedData);
// <Buffer 7b 22 69 6e 74 22 3a 31 32 33 34 2c 22 73 74 72 22 3a 22 61 62 63 64 22 2c 22 61 72 72 22 3a 5b 22 61 22 2c 22 62 22 2c 22 63 22 2c 22 64 22 5d 2c 22 ... 30 more bytes>

// Decoding in the same format as the protocol.
const decodedData = dpbc.decode(encodedData);
console.log(decodedData);
// {
//   int: 1234,
//   str: 'abcd',
//   arr: [ 'a', 'b', 'c', 'd' ],
//   obj: { name: 'jack', age: 20 }
// }
```

## License
This project is licensed under the [MIT License](./license).

## Keywords
[binary](https://www.npmjs.com/search?q=keywords:binary)   [codec](https://www.npmjs.com/search?q=keywords:codec)   [encode](https://www.npmjs.com/search?q=keywords:encode)   [decode](https://www.npmjs.com/search?q=keywords:decode)   [protocol](https://www.npmjs.com/search?q=keywords:protocol)   [buffer](https://www.npmjs.com/search?q=keywords:buffer)   [serialization](https://www.npmjs.com/search?q=keywords:serialization)   [deserialization](https://www.npmjs.com/search?q=keywords:deserialization)