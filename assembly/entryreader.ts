import { DataReader } from "./datareader";
import { Option } from "./option";

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
      return new Str(this.readString((marker & 0b00011111) as usize));
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
    } else if (marker == 0b11000111) {
      let length = this.reader.getUint8() as usize;
      let type = this.reader.getUint8();
      return new ExtData(type, this.readBinData(length));
    } else if (marker == 0b11001000) {
      let length = this.reader.getUint16() as usize;
      let type = this.reader.getUint8();
      return new ExtData(type, this.readBinData(length));
    } else if (marker == 0b11001001) {
      let length = this.reader.getUint32() as usize;
      let type = this.reader.getUint8();
      return new ExtData(type, this.readBinData(length));
    } else if (marker == 0b11001010) {
      return new Float(this.reader.getFloat32() as f64);
    } else if (marker == 0b11001011) {
      return new Float(this.reader.getFloat64());
    } else if (marker == 0b11001100) {
      return new UInt(this.reader.getUint8() as u64);
    } else if (marker == 0b11001101) {
      return new UInt(this.reader.getUint16() as u64);
    } else if (marker == 0b11001110) {
      return new UInt(this.reader.getUint32() as u64);
    } else if (marker == 0b11001111) {
      return new UInt(this.reader.getUint64());
    } else if (marker == 0b11010000) {
      return new Int(this.reader.getInt8() as i64);
    } else if (marker == 0b11010001) {
      return new Int(this.reader.getInt16() as i64);
    } else if (marker == 0b11010010) {
      return new Int(this.reader.getInt32() as i64);
    } else if (marker == 0b11010011) {
      return new Int(this.reader.getInt64());
    } else if (marker == 0b11010100) {
      return new ExtData(this.reader.getUint8(), this.readBinData(1));
    } else if (marker == 0b11010101) {
      return new ExtData(this.reader.getUint8(), this.readBinData(2));
    } else if (marker == 0b11010110) {
      return new ExtData(this.reader.getUint8(), this.readBinData(4));
    } else if (marker == 0b11010111) {
      return new ExtData(this.reader.getUint8(), this.readBinData(8));
    } else if (marker == 0b11011000) {
      return new ExtData(this.reader.getUint8(), this.readBinData(16));
    } else if (marker == 0b11011001) {
      return new Str(this.readString(this.reader.getUint8() as usize));
    } else if (marker == 0b11011010) {
      return new Str(this.readString(this.reader.getUint16() as usize));
    } else if (marker == 0b11011011) {
      return new Str(this.readString(this.reader.getUint32() as usize));
    } else if (marker == 0b11011100) {
      return new ArrayLength(this.reader.getUint16() as usize);
    } else if (marker == 0b11011101) {
      return new ArrayLength(this.reader.getUint32() as usize);
    } else if (marker == 0b11011110) {
      return new MapLength(this.reader.getUint16() as usize);
    } else if (marker == 0b11011111) {
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
  isInt(strict: bool = 0): bool {
    return false;
  }

  tryReadInt(_strict: bool = 0): Option<i64> {
    return Option.None<i64>();
  }

  readInt(strict: bool = 0): i64 {
    return this.tryReadInt(strict).getOr(0);
  }

  isUint(_strict: bool = 0): bool {
    return false;
  }

  tryReadUint(_strict: bool = 0): Option<u64> {
    return Option.None<u64>();
  }

  readUint(strict: bool = 0): u64 {
    return this.tryReadUint(strict).getOr(0);
  }

  isFloat(): bool {
    return false;
  }

  tryReadFloat(): Option<f64> {
    return Option.None<f64>();
  }

  readFloat(): f64 {
    return this.tryReadFloat().getOr(0);
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

  tryReadBool(): Option<bool> {
    return Option.None<bool>();
  }

  readBool(): bool {
    return this.tryReadBool().getOr(false);
  }

  isString(): bool {
    return false;
  }

  tryReadString(): Option<string> {
    return Option.None<string>();
  }

  readString(): string {
    return this.tryReadString().getOr("");
  }

  isMapLength(): bool {
    return false;
  }

  tryReadMapLength(): Option<usize> {
    return Option.None<usize>();
  }

  readMapLength(): usize {
    return this.tryReadMapLength().getOr(0);
  }

  isArrayLength(): bool {
    return false;
  }

  tryReadArrayLength(): Option<usize> {
    return Option.None<usize>();
  }

  readArrayLength(): usize {
    return this.tryReadArrayLength().getOr(0);
  }

  isBinData(): bool {
    return false;
  }

  tryReadBinData(): Option<ArrayBuffer> {
    return Option.None<ArrayBuffer>();
  }

  readBinData(): ArrayBuffer {
    return this.tryReadBinData().getOr(new ArrayBuffer(0));
  }

  isExt(): bool {
    return false;
  }

  tryReadExt(): Option<ExtensionData> {
    return Option.None<ExtensionData>();
  }

  readExt(): ExtensionData {
    return this.tryReadExt().getOr(new ExtensionData(0, new ArrayBuffer(0)));
  }

  abstract toString(): string;
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

  isInt(strict: bool = 0): bool {
    return true;
  }

  tryReadInt(_strict: bool = 0): Option<i64> {
    return Option.Some(this.value);
  }

  isUint(strict: bool = 0): bool {
    return !strict && this.value >= 0;
  }

  tryReadUint(strict: bool = 0): Option<u64> {
    if (this.isUint(strict)) {
      return Option.Some(this.value as u64);
    } else {
      return Option.None<u64>();
    }
  }

  toString(): string {
    return "Int: " + this.value.toString();
  }
}

class UInt extends Entry {
  value: u64;

  constructor(value: u64) {
    super();
    this.value = value;
  }

  isInt(strict: bool = 0): bool {
    return !strict && this.value <= (i64.MAX_VALUE as u64);
  }

  tryReadInt(strict: bool = 0): Option<i64> {
    if (this.isInt(strict)) {
      return Option.Some(this.value as i64);
    } else {
      return Option.None<i64>();
    }
  }

  isUint(_strict: bool = 0): bool {
    return true;
  }

  tryReadUint(_strict: bool = 0): Option<u64> {
    return Option.Some(this.value);
  }

  toString(): string {
    return "Uint: " + this.value.toString();
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

  tryReadFloat(): Option<f64> {
    return Option.Some(this.value);
  }

  toString(): string {
    return "Float: " + this.value.toString();
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

  tryReadBool(): Option<bool> {
    return Option.Some(this.value);
  }

  toString(): string {
    return "Bool: " + this.value.toString();
  }
}

class Null extends Entry {
  isNull(): bool {
    return true;
  }

  toString(): string {
    return "Null";
  }
}

class Unused extends Entry {
  isUnused(): bool {
    return true;
  }

  toString(): string {
    return "Unused";
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

  tryReadString(): Option<string> {
    return Option.Some(this.text);
  }

  toString(): string {
    return "String: " + this.text;
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

  tryReadMapLength(): Option<usize> {
    return Option.Some(this.length);
  }

  toString(): string {
    return "MapLength: " + this.length.toString();
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

  tryReadArrayLength(): Option<usize> {
    return Option.Some(this.length);
  }

  toString(): string {
    return "ArrayLength: " + this.length.toString();
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

  tryReadBinData(): Option<ArrayBuffer> {
    return Option.Some(this.data);
  }

  toString(): string {
    return "BinData: " + this.data.toString();
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

  tryReadExt(): Option<ExtensionData> {
    return Option.Some(new ExtensionData(this.type, this.data));
  }

  toString(): string {
    return "ExtData: " + this.type.toString() + ", " + this.data.toString();
  }
}
