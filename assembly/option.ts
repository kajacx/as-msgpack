export abstract class Option<T> {
  static Some<T>(value: T): Option<T> {
    return new Some<T>(value);
  }

  static None<T>(): Option<T> {
    return new None<T>();
  }

  abstract isSome(): bool;

  abstract getOr(defaultValue: T): T;

  abstract get(hint: string | null): T;
}

class Some<T> extends Option<T> {
  private value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  isSome(): bool {
    return true;
  }

  getOr(_defaultValue: T): T {
    return this.value;
  }

  get(_hint: string | null): T {
    return this.value;
  }
}

class None<T> extends Option<T> {
  isSome(): bool {
    return false;
  }

  getOr(defaultValue: T): T {
    return defaultValue;
  }

  get(hint: string | null): T {
    if (hint != null) {
      throw new Error("Called get on a None Option: " + hint);
    } else {
      throw new Error("Called get on a None Option");
    }
  }
}
