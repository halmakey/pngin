import { CustomError } from "ts-custom-error";

export class ValidatorError extends CustomError {}

export interface Validator<T> {
  (value: unknown, label: string): T;
}

export function isValidatorError(err: unknown): err is ValidatorError {
  return err instanceof ValidatorError;
}

export function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (value, label) => {
    if (value === undefined) {
      return value;
    }
    return validator(value, label);
  };
}

export const stringValidator = {
  default: ((value, label) => {
    if (typeof value !== "string" || value.length > 4096) {
      throw new Error(label);
    }
    return value;
  }) as Validator<string>,
  range<T extends string>(min: number, max: number): Validator<T> {
    return (value, label) => {
      if (
        typeof value !== "string" ||
        value.length < min ||
        value.length > max
      ) {
        throw new Error(label);
      }
      return value as T;
    };
  },
  enum<T extends string>(...expects: T[]): Validator<T> {
    return (value, label) => {
      if (typeof value !== "string" || !expects.includes(value as T)) {
        throw new ValidatorError(label);
      }
      return value as T;
    };
  },
  regexp<T extends string = string>(regexp: RegExp): Validator<T> {
    return (value, label) => {
      if (typeof value !== "string" || !regexp.test(value)) {
        throw new ValidatorError(label);
      }
      return value as T;
    };
  },
};

export const nanoIDValidator = stringValidator.range(4, 40);

export const numberValidator = {
  finite: ((value, label) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidatorError(label);
    }
    return value;
  }) as Validator<number>,
  range(min: number, max: number): Validator<number> {
    return (value, label) => {
      if (typeof value !== "number" || value < min || value > max) {
        throw new ValidatorError(label);
      }
      return value;
    };
  },
  select(...numbers: number[]): Validator<number> {
    return (value, label) => {
      if (typeof value !== "number" || !numbers.includes(value)) {
        throw new ValidatorError(label);
      }
      return value;
    };
  },
  exact<N extends number>(number: N): Validator<N> {
    return (value, label) => {
      if (typeof value !== "number" || value !== number) {
        throw new ValidatorError(label);
      }
      return value as N;
    };
  },
};

export function createNumberValidator(
  min: number = -Infinity,
  max: number = Infinity
): Validator<number> {
  return (value, label) => {
    if (typeof value !== "number" || value < min || value > max) {
      throw new ValidatorError(label);
    }
    return value;
  };
}

type ValidatedValue<T> = T extends Validator<infer U> ? U : never;
export const objectValidator = {
  with<V extends { [key: string]: Validator<any> }>(
    validators: V
  ): Validator<{ [key in keyof V]: ValidatedValue<V[key]> }> {
    return (values, label) => {
      if (typeof values !== "object" || !values) {
        throw new Error(label);
      }
      const targets: Record<string, unknown> = { ...values };

      let results = {};
      for (const key of Object.keys(validators)) {
        const value = targets[key];
        const result = validators[key](value, [label, key].join("."));
        results = { ...results, [key]: result };
        delete targets[key];
      }

      if (Object.keys(targets).length > 0) {
        throw new Error(
          label +
            Object.keys(targets)
              .map((k) => "." + k + "?")
              .join(" ")
        );
      }

      return results as { [key in keyof V]: ValidatedValue<V[key]> };
    };
  },
  select<V extends { [key: string]: Validator<any> }>(
    ...validators: V[]
  ): Validator<{ [key in keyof V]: ValidatedValue<V[key]> }> {
    const withs = validators.map((v) => objectValidator.with(v));
    return (values, label) => {
      let error;
      for (const validator of withs) {
        try {
          return validator(values, label);
        } catch (err) {
          error = err;
        }
      }
      throw error;
    };
  },
};

export const arrayValidator = {
  with<V extends Validator<any>>(
    validator: V,
    min = 0,
    max = 1024
  ): Validator<ValidatedValue<V>[]> {
    return (values, label) => {
      if (!Array.isArray(values)) {
        throw new ValidatorError(label);
      }
      if (values.length < min || values.length > max) {
        throw new ValidatorError(label + ".length");
      }

      const results: ValidatedValue<V>[] = new Array(values.length);
      for (let index = 0; index < values.length; index++) {
        const value = values[index];
        results[index] = validator(value, `${label}[${index}]`);
      }
      return results;
    };
  },
};

export const booleanValidator: Validator<boolean> = (value, label) => {
  if (typeof value === "boolean") {
    return value;
  }
  throw new ValidatorError(label);
};
