import fs from 'fs/promises';
import { customRandom } from 'nanoid';
import seedRandom from 'seedrandom';
import path from 'path';

export async function walk(directory: string) {
  let fileList: string[] = [];

  const files = await fs.readdir(directory);
  for (const file of files) {
    const p = path.join(directory, file);
    if ((await fs.stat(p)).isDirectory()) {
      fileList = [...fileList, ...(await walk(p))];
    } else {
      fileList.push(p);
    }
  }

  return fileList;
}

/**
 * Type predicate for filtering null values
 * https://stackoverflow.com/a/46700791
 */
export const notEmpty = <TValue>(
  value: TValue | null | undefined,
): value is TValue =>
  // eslint-disable-next-line id-blacklist
  value !== null && value !== undefined;

export const atob = (a: string)=>  Buffer.from(a, 'base64').toString('binary');
export const btoa = (b: string) => Buffer.from(b).toString('base64');


export function initializeIdGenerator(size = 21, seed = '42') {
  const rng = seedRandom(seed);
  return customRandom('abcdefghijklmnopqrstuvwxyz0123456789', size, size =>
    new Uint8Array(size).map(() => 256 * rng()),
  );
}
