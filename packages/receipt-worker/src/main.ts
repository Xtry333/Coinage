import { ReceiptWorker } from './worker';

const worker = new ReceiptWorker();

process.on('SIGINT', () => {
    console.log('[receipt-worker] Received SIGINT, shutting down...');
    worker.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[receipt-worker] Received SIGTERM, shutting down...');
    worker.stop();
    process.exit(0);
});

worker.start().catch((err) => {
    console.error('[receipt-worker] Fatal error:', err);
    process.exit(1);
});
