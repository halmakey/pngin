export function createConcurrent(max: number) {
  let pool: (() => void)[] = [];
  let concurrency = 0;
  return {
    queue<T>(main: () => Promise<T>) {
      return new Promise<T>((resolve, reject) => {
        const current = () => {
          concurrency++;
          return main()
            .then(resolve, reject)
            .then(() => {
              concurrency--;
              const next = pool.shift();
              if (next) {
                next();
              }
            });
        };
        if (concurrency >= max) {
          pool.push(current);
          return;
        }
        current();
      });
    },
  };
}
