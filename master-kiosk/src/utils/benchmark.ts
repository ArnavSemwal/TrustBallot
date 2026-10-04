export const Benchmark = {
  measureTime: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    console.log(`⏱️ [BENCHMARK] ${name}: ${duration.toFixed(2)} ms`);
    window.dispatchEvent(new CustomEvent('benchmark-log', { detail: { name, type: 'time', value: duration.toFixed(2) + ' ms' } }));
    return result;
  },

  calculatePayloadSize: (payload: any): number => {
    const str = JSON.stringify(payload);
    const bytes = new Blob([str]).size;
    console.log(`📦 [BENCHMARK] Payload Size: ${bytes} bytes`);
    window.dispatchEvent(new CustomEvent('benchmark-log', { detail: { name: 'Payload Size', type: 'size', value: bytes + ' bytes' } }));
    return bytes;
  },
};
