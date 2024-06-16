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
      return new FixInt(marker);
      // Fix map:       0b1000xxxx
    } else if (marker < 0b10010000) {
      return new FixMap(marker & 0b00001111);
      // Fix array:     0b1001xxxx
    } else if (marker < 0b10100000) {
      return new FixArr(marker & 0b00001111);
      return new FixStr(marker & 0b00001111);
    } else if (marker == 0b11000000) {
      return new Null();
      // } else if (marker == 0b110)
    }
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

  tryReadBinData(): Uint8Array {
    throw new Error("Entry is not bin data: " + this);
  }

  readBinData(): Uint8Array {
    try {
      return this.tryReadBinData();
    } catch (_) {
      return new Uint8Array(0);
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
      return new ExtensionData(0, new Uint8Array(0));
    }
  }
}

export class ExtensionData {
  type: u8;
  data: Uint8Array;

  constructor(type: u8, data: Uint8Array) {
    this.type = type;
    this.data = data;
  }
}

class Int extends Entry {
  value: u64;

  constructor(value: u64) {
    super();
    this.value = value;
  }
}

class UInt extends Entry {}

class Float extends Entry {
  value: f64;

  constructor(value: f64) {
    super();
    this.value = value;
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

class Str extends Entry {
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }
}

class Null extends Entry {}

class Unused extends Entry {}

class Bool extends Entry {}

class BinData extends Entry {}

class Ext extends Entry {}
