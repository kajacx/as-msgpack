import { DataReader } from "./datareader";
import { Format } from "./format";
import { E_INVALIDLENGTH } from "util/error";

export class SizedReader {
  private reader: DataReader;

  constructor(reader: DataReader) {
    this.reader = reader;
  }

  nextEntry(): Entry {
    const marker = this.reader.getUint8();
    // Fix int:   0b1xxxxxx
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
    } else if (marker < 256) {
      return new Int(marker as i8 as i64);
    } else {
      throw new Error("Unrecognized marker: " + marker);
    }
  }

  private readString(length: usize): string {
    return String.UTF8.decode(this.reader.getBytes(length));
  }

  private readBinData(length: usize): ArrayBuffer {
    return this.reader.getBytes(length);
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
    throw new Error("Entry is not bool: " + this);
  }

  readBool(): bool {
    try {
      return this.readBool();
    } catch (_) {
      return false;
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
}

class UInt extends Entry {
  value: u64;

  constructor(value: u64) {
    super();
    this.value = value;
  }
}

class Float extends Entry {
  value: f64;

  constructor(value: f64) {
    super();
    this.value = value;
  }
}

class Bool extends Entry {
  value: bool;

  constructor(value: bool) {
    super();
    this.value = value;
  }
}

class Null extends Entry {}

class Unused extends Entry {}

class Str extends Entry {
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }
}

class MapLength extends Entry {
  length: usize;

  constructor(length: usize) {
    super();
    this.length = length;
  }
}

class ArrayLength extends Entry {
  length: usize;

  constructor(length: usize) {
    super();
    this.length = length;
  }
}

class BinData extends Entry {
  data: ArrayBuffer;

  constructor(data: ArrayBuffer) {
    super();
    this.data = data;
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
}
