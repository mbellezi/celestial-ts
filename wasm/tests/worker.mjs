import { parentPort, workerData } from 'node:worker_threads';
import { celestial } from './runtime.ts';

celestial.setSidMode(workerData.mode);
parentPort.postMessage('ready');
parentPort.once('message', () => {
  parentPort.postMessage(celestial.ayanamsa(2451545));
  parentPort.close();
});
