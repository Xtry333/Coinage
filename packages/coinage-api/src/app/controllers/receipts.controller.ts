import { ReceiptDTO, ReceiptDetailsDTO, ReceiptPendingDTO, ReceiptProcessingStatus, ReceiptUploadResponseDTO, TransferDTO, TransferType } from '@app/interfaces';
import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHash } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { TransferDao } from '../daos/transfer.dao';
import { Receipt, ReceiptProcessingStatus as EntityReceiptProcessingStatus } from '../entities/Receipt.entity';
import { Transfer } from '../entities/Transfer.entity';
import { DateParserService } from '../services/date-parser.service';
import { EventsGateway } from '../events/events.gateway';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'receipts');

if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

const multerStorage = diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `receipt-${unique}${extname(file.originalname)}`);
    },
});

@Controller('receipt(s)?')
export class ReceiptsController {
    public constructor(
        private readonly transferDao: TransferDao,
        private readonly receiptDao: ReceiptDao,
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly accountDao: AccountDao,
        private readonly dateParserService: DateParserService,
        private readonly eventsGateway: EventsGateway,
    ) {}

    @Post(':id/upload-image')
    @UseInterceptors(FileInterceptor('file', { storage: multerStorage }))
    public async uploadReceiptImage(
        @Param('id') id: number,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<ReceiptUploadResponseDTO> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const receipt = await this.receiptDao.getById(id);
        const hash = createHash('sha256').update(require('fs').readFileSync(file.path)).digest('hex');

        const duplicate = await this.receiptDao.findByHash(hash);
        if (duplicate && duplicate.id !== receipt.id) {
            require('fs').unlinkSync(file.path);
            return { receiptId: id, isDuplicate: true, duplicateOfReceiptId: duplicate.id, status: ReceiptProcessingStatus.DUPLICATE };
        }

        receipt.imagePath = file.path;
        receipt.imageHash = hash;
        receipt.processingStatus = EntityReceiptProcessingStatus.PENDING;
        await this.receiptDao.save(receipt);

        this.eventsGateway.emitReceiptQueued(id);

        return { receiptId: id, isDuplicate: false, status: ReceiptProcessingStatus.PENDING };
    }

    @Post(':id/confirm-duplicate')
    public async confirmDuplicateUpload(@Param('id') id: number, @Body() body: { filePath: string }): Promise<{ ok: boolean }> {
        const receipt = await this.receiptDao.getById(id);
        receipt.processingStatus = EntityReceiptProcessingStatus.PENDING;
        await this.receiptDao.save(receipt);
        this.eventsGateway.emitReceiptQueued(id);
        return { ok: true };
    }

    @Get('pending')
    public async getPendingReceipts(): Promise<ReceiptPendingDTO[]> {
        const pending = await this.receiptDao.getPending();
        return pending.map((r) => ({
            id: r.id,
            imagePath: r.imagePath ?? '',
            processingStatus: r.processingStatus as unknown as ReceiptProcessingStatus,
        }));
    }

    @Get(':id/status')
    public async getReceiptStatus(@Param('id') id: number): Promise<{ status: ReceiptProcessingStatus; aiData?: object | null }> {
        const receipt = await this.receiptDao.getById(id);
        return {
            status: receipt.processingStatus as unknown as ReceiptProcessingStatus,
            aiData: receipt.aiExtractedData,
        };
    }

    @Patch(':id/worker-status')
    public async updateWorkerStatus(
        @Param('id') id: number,
        @Body() body: { status: string; aiData?: object },
    ): Promise<{ ok: boolean }> {
        const validStatuses = Object.values(EntityReceiptProcessingStatus) as string[];
        if (!validStatuses.includes(body.status)) {
            throw new BadRequestException(`Invalid status: ${body.status}`);
        }
        const status = body.status as EntityReceiptProcessingStatus;
        await this.receiptDao.updateStatus(id, status, body.aiData);

        if (status === EntityReceiptProcessingStatus.PROCESSED) {
            this.eventsGateway.emitReceiptProcessed(id, body.aiData ?? {});
        } else if (status === EntityReceiptProcessingStatus.ERROR) {
            this.eventsGateway.emitReceiptError(id, 'Processing failed');
        } else if (status === EntityReceiptProcessingStatus.PROCESSING) {
            this.eventsGateway.emitReceiptProcessing(id);
        }

        return { ok: true };
    }

    @Get('all')
    public async getAllReceipts(): Promise<ReceiptDTO[]> {
        const receipts = await this.receiptDao.getAll();
        return receipts.map((receipt) => ({
            id: receipt.id,
            description: receipt.description,
            date: receipt.date,
            amount: receipt.amount,
            contractor: receipt.contractor?.name,
            transferIds: receipt.transfers?.map((t) => t.id) || [],
        }));
    }

    @Get(':id/details')
    public async getReceiptDetails(@Param('id') id: number): Promise<ReceiptDetailsDTO> {
        if (!id) {
            throw new Error('Invalid ID provided.');
        }
        const receipt = await this.receiptDao.getById(id);

        return {
            id: receipt.id,
            date: receipt.date,
            nextTransferDate: this.getNextTransferDate(receipt.transfers),
            description: receipt.description,
            amount: Number(receipt.amount),
            totalAmount: this.calculateTotalAmount(receipt.transfers, true),
            totalTransferred: this.calculateTotalAmount(receipt.transfers, false),
            contractorId: receipt.contractor?.id ?? null,
            contractorName: receipt.contractor?.name ?? null,
            allTransfers: receipt.transfers.map(this.toTransferDTO),
        };
    }

    private calculateTotalAmount(transfers: Transfer[], withPlanned: boolean): number {
        return Math.abs(
            transfers
                ?.filter((t) => withPlanned || new Date(t.date) <= new Date())
                .reduce((amount, t) => amount + Number(t.amount) * TransferType[t.category.type].mathSymbol, 0),
        );
    }

    private toTransferDTO(transfer: Transfer): TransferDTO {
        return {
            id: transfer.id,
            date: transfer.date,
            description: transfer.description,
            amount: Number(transfer.amount),
            currency: transfer.currency.symbol,
            type: transfer.type,
            categoryId: transfer.category.id,
            categoryName: transfer.category.name,
            contractorId: transfer.contractorId ?? null,
            contractorName: transfer.contractor?.name ?? null,
            accountId: transfer.originAccount.id,
            accountName: transfer.originAccount.name,
            receiptId: transfer.receiptId ?? null,
            isFlagged: transfer.isFlagged,
        };
    }

    private getNextTransferDate(transfers: Transfer[]): Date | undefined {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayTransfersIndex = transfers.find((t) => t.date.getTime() > new Date().getTime());
        if (todayTransfersIndex) {
            return todayTransfersIndex.date;
        }
    }
}
