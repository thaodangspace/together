let counter = 0;
const listeners = new Set<() => void>();

export function getCounter() {
  return counter;
}

export function notifyUpdate() {
  counter++;
  for (const listener of listeners) {
    try {
      listener();
    } catch (_) {
      // ignore listener errors
    }
  }
}

export function waitForUpdate(last: number, timeout = 25000): Promise<void> {
  if (counter > last) return Promise.resolve();
  return new Promise((resolve) => {
    const onUpdate = () => {
      listeners.delete(onUpdate);
      clearTimeout(timer);
      resolve();
    };
    listeners.add(onUpdate);
    const timer = setTimeout(onUpdate, timeout);
  });
}
