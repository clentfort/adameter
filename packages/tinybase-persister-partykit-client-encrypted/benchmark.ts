import { type Content } from 'tinybase';
import { encryptContent, decryptContent, getEncryptionKey } from './src/crypto';

async function runBenchmark() {
  const roomName = 'benchmark-room';
  const key = await getEncryptionKey(roomName);

  const rowCounts = [100, 500, 1000, 2000, 5000];
  const cellsPerRow = 5;

  for (const rowCount of rowCounts) {
    console.log(`\n--- Benchmarking ${rowCount} rows with ${cellsPerRow} cells each ---`);

    const tables: any = {
      table1: {}
    };
    for (let i = 0; i < rowCount; i++) {
      const row: any = {};
      for (let j = 0; j < cellsPerRow; j++) {
        row[`cell${j}`] = `value-${i}-${j}`;
      }
      tables.table1[`row${i}`] = row;
    }

    const content: Content = [tables, { value1: 'v1' }];

    const startEncrypt = performance.now();
    const encrypted = await encryptContent(content, key);
    const endEncrypt = performance.now();
    console.log(`Encrypt took: ${(endEncrypt - startEncrypt).toFixed(2)}ms`);

    const startDecrypt = performance.now();
    await decryptContent(encrypted, key);
    const endDecrypt = performance.now();
    console.log(`Decrypt took: ${(endDecrypt - startDecrypt).toFixed(2)}ms`);
  }
}

runBenchmark().catch(console.error);
