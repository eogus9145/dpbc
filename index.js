const { Buffer } = require('buffer');
const fs = require('fs').promises;

class DPBC {

    constructor() {
        this.protocol = null;
        this.protocolList = {};
        this.protocolType = null;
    }

    async addProtocol(path) {
        const invalidPathError = "프로토콜 정의 JSON파일 경로가 올바르지 않습니다.";
        if(!path) throw new Error(invalidPathError);
        let jsonStr;
        try {
            jsonStr = await fs.readFile(path);
        } catch(err) {
            throw new Error(invalidPathError);
        }
        const jsonObj = JSON.parse(jsonStr);
        const protocolName = jsonObj.name;
        this.protocolList[protocolName] = jsonObj;
    }

    deleteProtocol(name) {
        delete this.protocolList[name];
        //if(this.protocol.name == name) this.protocol = null;
    }

    useProtocol(name) {
        this.protocol = this.protocolList[name];
    }

    async setProtocol(protocolJsonPath) {
        this.protocol = (protocolJsonPath) ? JSON.parse(await fs.readFile(protocolJsonPath)) : null;
    }

    request() {
        this.protocolType = 'request';
        return this;
    }
    
    response() {
        this.protocolType = 'response';
        return this;
    }

    encode(target) {
        if(!this.protocolType) throw new Error("프로토콜 요청 또는 응답을 설정해 주세요");
        const msgType = this.protocolType;
        this.protocolType = null;

        const name = this.protocol.name;
        const fields = this.protocol[msgType];

        const notObjectErrorMsg = `객체가 정의된 ${name} 프로토콜과 일치하지 않습니다.`;
        if(typeof target !== 'object') throw new Error(notObjectErrorMsg);
        
        const requiredFields = fields.filter(f => !f.nullable || f.nullable !== true).map(v => v.name);
        const paramKeys = Object.keys(target).filter(v => requiredFields.includes(v)).sort();
        const fieldNames = requiredFields.sort();
        if (JSON.stringify(paramKeys) !== JSON.stringify(fieldNames)) throw new Error(notObjectErrorMsg);
        
        let newTarget = {};
        fields.map((v) => {
            if(target[v.name]) newTarget[v.name] = target[v.name];
        });
        target = newTarget;

        const hasNullType = fields.some(v => !v.type || v.type.trim() == "");
        if(hasNullType) throw new Error(notObjectErrorMsg);
        let resultBuffer = Buffer.alloc(0);
        for(let i=0; i<fields.length; i++) {
            let itemName = fields[i].name;
            let itemType = fields[i].type;
            let itemValue = target[fields[i].name] || null;
            let isNullable = fields[i].nullable ? fields[i].nullable : false;
            let itemBuffer;
            let bufferSize;

            if(itemType.startsWith("int") || itemType.startsWith("uint")) {
                let isNumber = !isNaN(itemValue);
                if(!isNumber) throw new Error(`${fields[i].name}이 ${itemType}타입이 아닙니다`);
                let writeFunc = this.#getTypeMapping(itemType)['writeFunc'];
                bufferSize = this.#getTypeMapping(itemType)['bufferSize'];
                itemBuffer = Buffer.alloc(bufferSize);
                itemBuffer[writeFunc](itemType.endsWith("64") ? BigInt(itemValue) : parseInt(itemValue));
            } else {
                if(['string', 'array', 'object'].includes(itemType.toLowerCase())) {
                    if(itemValue) {
                        if(itemType.toLowerCase() == 'array' || itemType.toLowerCase() == 'object') {
                            itemValue = JSON.stringify(itemValue);
                        }
                        bufferSize = this.#getTypeMapping('uint32')['bufferSize'];
                        let strLength = itemValue.length;
                        let lenBuf = Buffer.alloc(bufferSize);
                        lenBuf.writeInt32BE(strLength, 0);
                        let strBuf = Buffer.from(itemValue, 'utf8');
                        itemBuffer = Buffer.concat([lenBuf, strBuf]);
                    } else {
                        if(isNullable == true) {
                            bufferSize = this.#getTypeMapping('int32')['bufferSize'];
                            let lenBuf = Buffer.alloc(bufferSize);
                            lenBuf.writeInt32BE(-1, 0);
                            itemBuffer = lenBuf;
                        } else {
                            throw new Error(`${itemName}은 null 또는 빈값일 수 없습니다.`)
                        }
                    }
                }
            }
            resultBuffer = Buffer.concat([resultBuffer, itemBuffer]);
        }
        return resultBuffer;
    }

    decode(target) {

        if(!this.protocolType) throw new Error("프로토콜 요청 또는 응답을 설정해 주세요");
        const msgType = this.protocolType;
        this.protocolType = null;
        
        const name = this.protocol.name;
        const fields = this.protocol[msgType];

        if(!Buffer.isBuffer(target)) throw new Error("디코딩 대상이 이진 바이너리 데이터가 아닙니다.");
        let buffer = target;
        let offset = 0;
        let result = {};
        for(let i=0; i<fields.length; i++) {
            let field = fields[i];
            let itemName = field.name;
            let itemType = field.type;
            
            let readSize;
            let readFunc;
            if(itemType.toLowerCase().startsWith("int") || itemType.toLowerCase().startsWith("uint")) {
                readSize = this.#getTypeMapping(itemType)['bufferSize'];
                readFunc = this.#getTypeMapping(itemType)['readFunc'];
                let value = buffer[readFunc](offset);
                offset = offset + readSize;
                result[itemName] = value;
            } else {
                if(['string', 'array', 'object'].includes(itemType.toLowerCase())) {
                    readSize = this.#getTypeMapping('int32')['bufferSize'];
                    readFunc = this.#getTypeMapping('int32')['readFunc'];
                    let strSize = buffer.readInt32BE(offset);
                    if(strSize == -1) {
                        offset = offset + readSize;
                        result[itemName] = null;
                    } else {
                        offset = offset + readSize;
                        let endOffset = offset + strSize;
                        let value = buffer.toString('utf8', offset, endOffset);
                        offset = endOffset;
                        if(itemType.toLowerCase() == 'string') {
                            result[itemName] = value;
                        } else {
                            result[itemName] = JSON.parse(value);
                        }
                    }
                }
            }
        }
        return result;
    }

    #getTypeMapping(type) {
        switch(type.toLowerCase()) {
            case 'int8' : return { bufferSize: 1, writeFunc: 'writeInt8', readFunc: 'readInt8' };
            case 'int16' : return { bufferSize: 2, writeFunc: 'writeInt16BE', readFunc: 'readInt16BE' };
            case 'int32' : return { bufferSize: 4, writeFunc: 'writeInt32BE', readFunc: 'readInt32BE' };
            case 'int64' : return { bufferSize: 8, writeFunc: 'writeBigInt64BE', readFunc: 'readBigInt64BE' };
            case 'uint8' : return { bufferSize: 1, writeFunc: 'writeUInt8', readFunc: 'readUInt8' };
            case 'uint16' : return { bufferSize: 2, writeFunc: 'writeUInt16BE', readFunc: 'readUInt16BE' };
            case 'uint32' : return { bufferSize: 4, writeFunc: 'writeUInt32BE', readFunc: 'readUInt32BE' };
            case 'uint64' : return { bufferSize: 8, writeFunc: 'writeBigUInt64BE', readFunc: 'readBigUInt64BE' };
            default: throw new Error("Unsupported type for reading: " + type);
        }
    }

}

module.exports = DPBC;
module.exports.default = DPBC;