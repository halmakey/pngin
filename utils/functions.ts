export function nop() {
  return () => {
    /* NOP */
  };
}

export function fail(message: string) {
  return () => {
    throw new Error(message);
  };
}
