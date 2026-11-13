import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
  plugins: [
    {
      // Arayüz bileşenlerinin kullandığı görsel listesi (testlerde boş)
      name: 'virtual-gorseller-test',
      resolveId: (id) => (id === 'virtual:gorseller' ? '\0virtual:gorseller' : null),
      load: (id) => (id === '\0virtual:gorseller' ? 'export default [];' : null),
    },
  ],
});
