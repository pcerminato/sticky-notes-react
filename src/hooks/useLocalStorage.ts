export function useLocalStorage<T>(
  key: string,
): [(data: T) => void, () => T | undefined] {
  function saveToLocalStorage(data: T) {
    /* 
    - Note on "performance vs consistency" -
      
    This implementation favors data consistency, because it persists the latest state on every mouseup.
    But as localStorage writes are synch (aka blocking), I am using requestIdleCallback() to do the writes 
    when the browser is idle (this idea is inspired by this tool https://github.com/GoogleChromeLabs/quicklink).
      
    A different approach that would favor performance is using a setInterval() to periodically and asynch save the records.
    But the data consistency would be compromised for example in the case that the user closes the browser after changing 
    the state and _before_ the interval ticks to save to localStorage; the latest state wouldn't be persisted.
      - Fix for that can be using window.onclose to trigger that last state save.
    */
    if (window.requestIdleCallback && data) {
      window.requestIdleCallback(() => {
        if (window.localStorage) {
          try {
            localStorage.setItem(key, JSON.stringify(data));
          } catch (error) {
            console.error(error);
          }
        }
      });
    }
  }
  function readFromLocalStorage(): T | undefined {
    if (window.localStorage) {
      try {
        const data = localStorage.getItem(key);

        if (data && data.length) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  return [saveToLocalStorage, readFromLocalStorage];
}
