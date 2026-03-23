import { BaseResponseDTO, ConfirmReceiptDTO, ReceiptDTO, ReceiptDetailsDTO, ReceiptPendingDTO, ReceiptProcessingStatus, ReceiptUploadResponseDTO, TransferDTO, TransferType } from '@app/interfaces';
import { BadRequestException, Body, Controller, Get, Logger, Param, ParseIntPipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHash } from 'crypto';
import { readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ItemDao } from '../daos/item.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { Item } from '../entities/Item.entity';
import { Receipt, ReceiptProcessingStatus as EntityReceiptProcessingStatus } from '../entities/Receipt.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { User } from '../entities/User.entity';
import { ReceiptQueuedEvent } from '../receipt-processing/events/receipt-queued.event';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { TransfersService } from '../services/transfers.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'receipts');

if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

const ENTITY_STATUS_TO_DTO: Record<EntityReceiptProcessingStatus, ReceiptProcessingStatus> = {
    [EntityReceiptProcessingStatus.NONE]: ReceiptProcessingStatus.NONE,
    [EntityReceiptProcessingStatus.PENDING]: ReceiptProcessingStatus.PENDING,
    [EntityReceiptProcessingStatus.PROCESSING]: ReceiptProcessingStatus.PROCESSING,
    [EntityReceiptProcessingStatus.EXTRACTED]: ReceiptProcessingStatus.EXTRACTED,
    [EntityReceiptProcessingStatus.PROCESSED]: ReceiptProcessingStatus.PROCESSED,
    [EntityReceiptProcessingStatus.DUPLICATE]: ReceiptProcessingStatus.DUPLICATE,
    [EntityReceiptProcessingStatus.ERROR]: ReceiptProcessingStatus.ERROR,
};
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const multerStorage = diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `receipt-${unique}${extname(file.originalname)}`);
    },
});

@UseGuards(AuthGuard)
@Controller('receipt(s)?')
export class ReceiptsController {
    private readonly logger = new Logger(ReceiptsController.name);

    public constructor(
        private readonly receiptDao: ReceiptDao,
        private readonly eventBus: EventBus,
        private readonly accountDao: AccountDao,
        private readonly categoryDao: CategoryDao,
        private readonly contractorDao: ContractorDao,
        private readonly itemDao: ItemDao,
        private readonly transfersService: TransfersService,
    ) {}

    @Post()
    public async createReceipt(): Promise<{ id: number }> {
        const receipt = new Receipt();
        receipt.amount = 0;
        receipt.processingStatus = EntityReceiptProcessingStatus.NONE;
        const result = await this.receiptDao.insert(receipt);
        return { id: result.identifiers[0].id as number };
    }

    @Post(':id/upload-image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: multerStorage,
            limits: { fileSize: MAX_FILE_SIZE_BYTES },
            fileFilter: (_req, file, cb) => {
                if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
                }
            },
        }),
    )
    public async uploadReceiptImage(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<ReceiptUploadResponseDTO> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const receipt = await this.receiptDao.getById(id);
        const hash = createHash('sha256').update(readFileSync(file.path)).digest('hex');

        const duplicate = await this.receiptDao.findByHash(hash);
        if (duplicate && duplicate.id !== receipt.id) {
            unlinkSync(file.path);
            return { receiptId: id, isDuplicate: true, duplicateOfReceiptId: duplicate.id, status: ReceiptProcessingStatus.DUPLICATE };
        }

        receipt.imagePath = file.path;
        receipt.imageHash = hash;
        receipt.processingStatus = EntityReceiptProcessingStatus.PENDING;
        await this.receiptDao.save(receipt);

        this.eventBus.publish(new ReceiptQueuedEvent(id, file.path));

        return { receiptId: id, isDuplicate: false, status: ReceiptProcessingStatus.PENDING };
    }

    @Post(':id/confirm-duplicate')
    public async confirmDuplicateUpload(@Param('id', ParseIntPipe) id: number): Promise<{ ok: boolean }> {
        const receipt = await this.receiptDao.getById(id);
        if (!receipt.imagePath) {
            throw new BadRequestException('Receipt has no image to process');
        }
        receipt.processingStatus = EntityReceiptProcessingStatus.PENDING;
        await this.receiptDao.save(receipt);
        this.eventBus.publish(new ReceiptQueuedEvent(id, receipt.imagePath));
        return { ok: true };
    }

    @Get('pending')
    public async getPendingReceipts(): Promise<ReceiptPendingDTO[]> {
        const pending = await this.receiptDao.getPending();
        return pending.map((r) => ({
            id: r.id,
            imagePath: '',
            processingStatus: ENTITY_STATUS_TO_DTO[r.processingStatus],
        }));
    }

    @Get(':id/status')
    public async getReceiptStatus(@Param('id', ParseIntPipe) id: number): Promise<{ status: ReceiptProcessingStatus; aiData?: object | null; rawAiResponse?: string | null }> {
        const receipt = await this.receiptDao.getById(id);
        return {
            status: ENTITY_STATUS_TO_DTO[receipt.processingStatus],
            aiData: receipt.aiExtractedData,
            rawAiResponse: receipt.rawAiResponse,
        };
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

    @Post(':id/confirm')
    public async confirmReceipt(
        @RequestingUser() user: User,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: ConfirmReceiptDTO,
    ): Promise<BaseResponseDTO> {
        const receipt = await this.receiptDao.getById(id);
        const account = await this.accountDao.getById(body.accountId);
        const contractor = body.contractorId ? await this.contractorDao.getById(body.contractorId) : null;
        const date = new Date(body.date);

        const includedItems = body.items.filter((i) => i.included);
        if (includedItems.length === 0) {
            throw new BadRequestException('No items selected');
        }

        // Resolve item IDs: create new items if needed
        const resolvedItems: Array<{ itemId: number; price: number; quantity: number; categoryId: number }> = [];
        for (const item of includedItems) {
            let itemId = item.itemId;
            let categoryId: number | null = null;

            if (item.isNew || !itemId) {
                const newItem = new Item();
                newItem.name = item.name;
                newItem.brand = null;
                newItem.categoryId = null;
                const saved = await this.itemDao.save(newItem);
                itemId = saved.id;
                this.logger.log(`Created new item "${item.name}" with id ${itemId}`);
            }

            // Get category from item
            const dbItem = await this.itemDao.getById(itemId);
            categoryId = dbItem.categoryId ?? (await this.categoryDao.getAll())[0]?.id ?? 1;

            resolvedItems.push({ itemId, price: item.price, quantity: item.quantity, categoryId });
        }

        // Group by category and create transfers
        const categoryMap = new Map<number, typeof resolvedItems>();
        for (const item of resolvedItems) {
            const group = categoryMap.get(item.categoryId) ?? [];
            group.push(item);
            categoryMap.set(item.categoryId, group);
        }

        const transferIds: number[] = [];
        for (const [categoryId, items] of categoryMap) {
            const category = await this.categoryDao.getById(categoryId);

            const transfer = new Transfer();
            transfer.amount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            transfer.currency = account.currency;
            transfer.date = date;
            transfer.categoryId = category.id;
            transfer.type = category.type;
            transfer.contractorId = contractor?.id ?? null;
            transfer.ownerUserId = user.id;
            transfer.originAccountId = account.id;
            transfer.targetAccountId = 17; // TODO: Fix this
            transfer.receiptId = receipt.id;
            transfer.isEthereal = true;

            await this.transfersService.saveTransfer(transfer);

            transfer.transferItems = items.map((item) => {
                const ti = new TransferItem();
                ti.transferId = transfer.id;
                ti.itemId = item.itemId;
                ti.quantity = item.quantity;
                ti.unitPrice = item.price;
                ti.totalSetPrice = item.price * item.quantity;
                ti.totalSetDiscount = 0;
                return ti;
            });

            const saved = await this.transfersService.saveTransfer(transfer);
            transferIds.push(saved.id);
        }

        // Update receipt with confirmed data
        receipt.amount = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        receipt.date = date;
        receipt.contractorId = contractor?.id ?? null;
        await this.receiptDao.save(receipt);

        this.logger.log(`Receipt ${id} confirmed: ${transferIds.length} transfer(s) created`);
        return { insertedIds: transferIds };
    }

    @Get(':id/details')
    public async getReceiptDetails(@Param('id', ParseIntPipe) id: number): Promise<ReceiptDetailsDTO> {
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
            allTransfers: receipt.transfers.map((t) => this.toTransferDTO(t)),
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
        return transfers.find((t) => t.date.getTime() > new Date().getTime())?.date;
    }
}
