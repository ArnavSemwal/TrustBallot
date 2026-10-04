export const Benchmark = {
  measureTime: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`⏱️ [BENCHMARK] ${name}: ${(end - start).toFixed(2)} ms`);
    return result;
  },

  calculatePayloadSize: (payload: any): number => {
    const str = JSON.stringify(payload);
    const bytes = new Blob([str]).size;
    console.log(`📦 [BENCHMARK] Payload Size: ${bytes} bytes`);
    return bytes;
  }
};
