import { DataReader } from "./datareader";

export class EntryReader {
  private reader: DataReader;
  private peekedEntry: Entry | null;

  constructor(reader: DataReader) {
    this.reader = reader;
    this.peekedEntry = null;
  }

  peek(): Entry | null {
    if (this.peekedEntry == null) {
      this.peekedEntry = this.readNextEntry();
    }
    return this.peekedEntry;
  }

  nextEntry(): Entry | null {
    if (this.peekedEntry != null) {
      const entry = this.peekedEntry;
      this.peekedEntry = null;
      return entry;
    } else {
      return this.readNextEntry();
    }
  }

  private readNextEntry(): Entry | null {
    const marker = this.reader.getUint8();
    if (this.reader.error() instanceof RangeError) {
      return null;
    }

    // Fix int:  0b1xxxxxx
    if (marker < 0b1000000) {
      return new Int(marker as i64);
      // Fix map:       0b1000xxxx
    } else if (marker < 0b10010000) {
      return new MapLength((marker & 0b00001111) as usize);
      // Fix array:     0b1001xxxx
    } else if (marker < 0b10100000) {
      return new ArrayLength((marker & 0b00001111) as usize);
      // Fix string:    0b101xxxxx
    } else if (marker < 0b11000000) {
      return new Str(this.readString((marker & 0x00011111) as usize));
    } else if (marker == 0b11000000) {
      return new Null();
    } else if (marker == 0b11000001) {
      return new Unused();
    } else if (marker == 0b11000010) {
      return new Bool(false);
    } else if (marker == 0b11000011) {
      return new Bool(true);
    } else if (marker == 0b11000100) {
      return new BinData(this.readBinData(this.reader.getUint8() as usize));
    } else if (marker == 0b11000101) {
      return new BinData(this.readBinData(this.reader.getUint16() as usize));
    } else if (marker == 0b11000110) {
      return new BinData(this.readBinData(this.reader.getUint32() as usize));
    } else if (marker == 0b10100111) {
      let length = this.reader.getUint8() as usize;
      let type = this.reader.getUint8();
      return new ExtData(type, this.readBinData(length));
    } else if (marker == 0b10101000) {
      let length = this.reader.getUint16() as usize;
      let type = this.reader.getUint8();
      return new ExtData(type, this.readBinData(length));
    } else if (marker == 0b10101001) {
      let length = this.reader.getUint32() as usize;
      let type = this.reader.getUint8();
      return new ExtData(type, this.readBinData(length));
    } else if (marker == 0b10101010) {
      return new Float(this.reader.getFloat32() as f64);
    } else if (marker == 0b10101011) {
      return new Float(this.reader.getFloat64());
    } else if (marker == 0b10101100) {
      return new UInt(this.reader.getUint8() as u64);
    } else if (marker == 0b10101101) {
      return new UInt(this.reader.getUint16() as u64);
    } else if (marker == 0b10101110) {
      return new UInt(this.reader.getUint32() as u64);
    } else if (marker == 0b10101111) {
      return new UInt(this.reader.getUint64());
    } else if (marker == 0b10110000) {
      return new Int(this.reader.getInt8() as i64);
    } else if (marker == 0b10110001) {
      return new Int(this.reader.getInt16() as i64);
    } else if (marker == 0b10110010) {
      return new Int(this.reader.getInt32() as i64);
    } else if (marker == 0b10110011) {
      return new Int(this.reader.getInt64());
    } else if (marker == 0b10110100) {
      return new ExtData(this.reader.getUint8(), this.readBinData(1));
    } else if (marker == 0b10110101) {
      return new ExtData(this.reader.getUint8(), this.readBinData(2));
    } else if (marker == 0b10110110) {
      return new ExtData(this.reader.getUint8(), this.readBinData(4));
    } else if (marker == 0b10110111) {
      return new ExtData(this.reader.getUint8(), this.readBinData(8));
    } else if (marker == 0b10111000) {
      return new ExtData(this.reader.getUint8(), this.readBinData(16));
    } else if (marker == 0b10111001) {
      return new Str(this.readString(this.reader.getUint8() as usize));
    } else if (marker == 0b10111010) {
      return new Str(this.readString(this.reader.getUint16() as usize));
    } else if (marker == 0b10111011) {
      return new Str(this.readString(this.reader.getUint32() as usize));
    } else if (marker == 0b10111100) {
      return new ArrayLength(this.reader.getUint16() as usize);
    } else if (marker == 0b10111101) {
      return new ArrayLength(this.reader.getUint32() as usize);
    } else if (marker == 0b10111110) {
      return new MapLength(this.reader.getUint16() as usize);
    } else if (marker == 0b10111111) {
      return new MapLength(this.reader.getUint32() as usize);
    } else {
      return new Int(marker as i8 as i64);
    }
  }

  private readString(length: usize): string {
    return String.UTF8.decode(this.reader.getBytes(length as i32));
  }

  private readBinData(length: usize): ArrayBuffer {
    return this.reader.getBytes(length as i32);
  }
}

export abstract class Entry {
  isInt(strict?: bool): bool {
    return false;
  }

  tryReadInt(strict?: bool): i64 {
    throw new Error("Entry is not an int: " + this);
  }

  readInt(strict?: bool): i64 {
    try {
      return this.tryReadInt(strict);
    } catch (_) {
      return 0;
    }
  }

  isUint(strict?: bool): bool {
    return false;
  }

  tryReadUint(strict?: bool): u64 {
    throw new Error("Entry is not an uint: " + this);
  }

  readUint(strict?: bool): u64 {
    try {
      return this.tryReadUint(strict);
    } catch (_) {
      return 0;
    }
  }

  isFloat(): bool {
    return false;
  }

  tryReadFloat(): f64 {
    throw new Error("Entry is not a float: " + this);
  }

  readFloat(): f64 {
    try {
      return this.tryReadFloat();
    } catch (_) {
      return 0;
    }
  }

  isNull(): bool {
    return false;
  }

  isUnused(): bool {
    return false;
  }

  isBool(): bool {
    return false;
  }

  tryReadBool(): bool {
    throw new Error("Entry is not a bool: " + this);
  }

  readBool(): bool {
    try {
      return this.readBool();
    } catch (_) {
      return false;
    }
  }

  isString(): bool {
    return false;
  }

  tryReadString(): string {
    throw new Error("Entry is not a string: " + this);
  }

  readString(): string {
    try {
      return this.tryReadString();
    } catch (_) {
      return "";
    }
  }

  isMapLength(): bool {
    return false;
  }

  tryReadMapLength(): usize {
    throw new Error("Entry is not a map length: " + this);
  }

  readMapLength(): usize {
    try {
      return this.readMapLength();
    } catch (_) {
      return 0;
    }
  }

  isArrayLength(): bool {
    return false;
  }

  tryReadArrayLength(): usize {
    throw new Error("Entry is not an array length: " + this);
  }

  readArrayLength(): usize {
    try {
      return this.readArrayLength();
    } catch (_) {
      return 0;
    }
  }

  isBinData(): bool {
    return false;
  }

  tryReadBinData(): ArrayBuffer {
    throw new Error("Entry is not bin data: " + this);
  }

  readBinData(): ArrayBuffer {
    try {
      return this.tryReadBinData();
    } catch (_) {
      return new ArrayBuffer(0);
    }
  }

  isExt(): bool {
    return false;
  }

  tryReadExt(): ExtensionData {
    throw new Error("Entry is not bin data: " + this);
  }

  readExt(): ExtensionData {
    try {
      return this.tryReadExt();
    } catch (_) {
      return new ExtensionData(0, new ArrayBuffer(0));
    }
  }
}

export class ExtensionData {
  type: u8;
  data: ArrayBuffer;

  constructor(type: u8, data: ArrayBuffer) {
    this.type = type;
    this.data = data;
  }
}

class Int extends Entry {
  value: i64;

  constructor(value: i64) {
    super();
    this.value = value;
  }

  isInt(strict?: bool): bool {
    return true;
  }

  tryReadInt(strict?: bool): i64 {
    return this.value;
  }

  isUint(strict?: bool): bool {
    return !strict && this.value >= 0;
  }

  tryReadUint(strict?: bool): u64 {
    if (strict) {
      throw new Error("Trying to read uint from an int in strict mode");
    } else if (this.value < 0) {
      throw new Error(
        "Trying to read uint from a negative in, value is: " + this.value
      );
    } else {
      return this.value as u64;
    }
  }
}

class UInt extends Entry {
  value: u64;

  constructor(value: u64) {
    super();
    this.value = value;
  }

  isInt(strict?: bool): bool {
    return !strict && this.value <= (i64.MAX_VALUE as u64);
  }

  tryReadInt(strict?: bool): i64 {
    if (strict) {
      throw new Error("Trying to read int from a uint in strict mode");
    } else if (this.value > (i64.MAX_VALUE as u64)) {
      throw new Error(
        "Trying to read int from too large uint, value is: " + this.value
      );
    } else {
      return this.value as i64;
    }
  }

  isUint(strict?: bool): bool {
    return true;
  }

  tryReadUint(strict?: bool): u64 {
    return this.value;
  }
}

class Float extends Entry {
  value: f64;

  constructor(value: f64) {
    super();
    this.value = value;
  }

  isFloat(): bool {
    return true;
  }

  tryReadFloat(): f64 {
    return this.value;
  }
}

class Bool extends Entry {
  value: bool;

  constructor(value: bool) {
    super();
    this.value = value;
  }

  isBool(): bool {
    return true;
  }

  tryReadBool(): bool {
    return this.value;
  }
}

class Null extends Entry {
  isNull(): bool {
    return true;
  }
}

class Unused extends Entry {
  isUnused(): bool {
    return true;
  }
}

class Str extends Entry {
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }

  isString(): bool {
    return true;
  }

  tryReadString(): string {
    return this.text;
  }
}

class MapLength extends Entry {
  length: usize;

  constructor(length: usize) {
    super();
    this.length = length;
  }

  isMapLength(): bool {
    return true;
  }

  tryReadMapLength(): usize {
    return this.length;
  }
}

class ArrayLength extends Entry {
  length: usize;

  constructor(length: usize) {
    super();
    this.length = length;
  }

  isArrayLength(): bool {
    return true;
  }

  tryReadArrayLength(): usize {
    return this.length;
  }
}

class BinData extends Entry {
  data: ArrayBuffer;

  constructor(data: ArrayBuffer) {
    super();
    this.data = data;
  }

  isBinData(): bool {
    return true;
  }

  tryReadBinData(): ArrayBuffer {
    return this.data;
  }
}

class ExtData extends Entry {
  type: u8;
  data: ArrayBuffer;

  constructor(type: u8, data: ArrayBuffer) {
    super();
    this.type = type;
    this.data = data;
  }

  isExt(): bool {
    return true;
  }

  tryReadExt(): ExtensionData {
    return new ExtensionData(this.type, this.data);
  }
}
