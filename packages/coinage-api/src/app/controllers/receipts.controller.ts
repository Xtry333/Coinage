import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import { extname, join, relative, resolve } from 'path';

import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';

import {
    BaseResponseDTO,
    ConfirmReceiptDTO,
    ReceiptDTO,
    ReceiptDetailsDTO,
    ReceiptPendingDTO,
    ReceiptProcessingStatus,
    ReceiptUploadResponseDTO,
    TransferDTO,
    TransferType,
    roundMoney,
} from '@app/interfaces';

import { AccountDao } from '../daos/account.dao';
import { CategoryDao } from '../daos/category.dao';
import { ContractorDao } from '../daos/contractor.dao';
import { ItemDao } from '../daos/item.dao';
import { ReceiptDao } from '../daos/receipt.dao';
import { Item } from '../entities/Item.entity';
import { ReceiptProcessingStatus as EntityReceiptProcessingStatus, Receipt } from '../entities/Receipt.entity';
import { Transfer } from '../entities/Transfer.entity';
import { TransferItem } from '../entities/TransferItem.entity';
import { User } from '../entities/User.entity';
import { ReceiptQueuedEvent } from '../receipt-processing/events/receipt-queued.event';
import { AuthGuard, RequestingUser } from '../services/auth.guard';
import { ItemPackagingService } from '../services/item-packaging.service';
import { getReceiptTags, getTransferTags } from '../services/tag-mapper';
import { assertNonnegativeTransferAmount, transferExpenseAmount } from '../services/transfers/transfer-amount';
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
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // MB

const multerStorage = diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `receipt-${unique}${extname(file.originalname)}`);
    },
});

@UseGuards(AuthGuard)
@Controller(['receipt', 'receipts'])
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
        private readonly packagingService: ItemPackagingService,
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
    public async uploadReceiptImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File): Promise<ReceiptUploadResponseDTO> {
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

        const relativePath = relative(process.cwd(), file.path);
        receipt.imagePath = relativePath;
        receipt.imageHash = hash;
        receipt.processingStatus = EntityReceiptProcessingStatus.PENDING;
        await this.receiptDao.save(receipt);

        this.eventBus.publish(new ReceiptQueuedEvent(id, relativePath));

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

    @Post(':id/retry')
    public async retryReceiptProcessing(@Param('id', ParseIntPipe) id: number): Promise<{ ok: boolean }> {
        const receipt = await this.receiptDao.getById(id);
        if (!receipt.imagePath) {
            throw new BadRequestException('Receipt has no image to process');
        }
        receipt.processingStatus = EntityReceiptProcessingStatus.PENDING;
        receipt.aiExtractedData = null;
        receipt.rawAiResponse = null;
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
    public async getReceiptStatus(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ status: ReceiptProcessingStatus; aiData?: object | null; rawAiResponse?: string | null; hasImage: boolean }> {
        const receipt = await this.receiptDao.getById(id);
        return {
            status: ENTITY_STATUS_TO_DTO[receipt.processingStatus],
            aiData: receipt.aiExtractedData,
            rawAiResponse: receipt.rawAiResponse,
            hasImage: !!receipt.imagePath,
        };
    }

    @Get(':id/image')
    public async getReceiptImage(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response): Promise<void> {
        const receipt = await this.receiptDao.getById(id);
        if (!receipt.imagePath) {
            throw new NotFoundException('Receipt has no image');
        }
        const absolutePath = resolve(process.cwd(), receipt.imagePath);
        if (!absolutePath.startsWith(UPLOAD_DIR)) {
            throw new NotFoundException('Receipt image not found');
        }
        if (!existsSync(absolutePath)) {
            throw new NotFoundException('Receipt image file not found on disk');
        }
        res.sendFile(absolutePath);
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
            tags: getReceiptTags(receipt.transfers),
        }));
    }

    @Post(':id/confirm')
    public async confirmReceipt(
        @RequestingUser() user: User,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: ConfirmReceiptDTO,
    ): Promise<BaseResponseDTO> {
        const receipt = await this.receiptDao.getById(id);
        const account = await this.accountDao.getById(body.originAccountId);
        const contractor = body.contractorId ? await this.contractorDao.getById(body.contractorId) : null;
        const date = new Date(body.date);

        const includedItems = body.items.filter((i) => i.included);
        if (includedItems.length === 0) {
            throw new BadRequestException('No items selected');
        }

        // Resolve item IDs: create new items if needed
        const resolvedItems: Array<{
            itemId: number;
            price: number;
            quantity: number;
            categoryId: number;
            packagingId: number | null;
            containerId: number | null;
        }> = [];
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

            const packaging = await this.packagingService.resolve(itemId, item.packagingId, null);
            resolvedItems.push({
                itemId,
                price: item.price,
                quantity: item.quantity,
                categoryId,
                packagingId: packaging?.id ?? null,
                containerId: packaging?.containerId ?? null,
            });
        }

        // Group by category and create transfers
        const categoryMap = new Map<number, typeof resolvedItems>();
        for (const item of resolvedItems) {
            const group = categoryMap.get(item.categoryId) ?? [];
            group.push(item);
            categoryMap.set(item.categoryId, group);
        }

        const groups = [...categoryMap].map(([categoryId, items]) => {
            const amount = roundMoney(items.reduce((sum, item) => sum + roundMoney(item.price * item.quantity), 0));
            assertNonnegativeTransferAmount(amount);
            return { categoryId, items, amount };
        });

        const transferIds: number[] = [];
        for (const { categoryId, items, amount } of groups) {
            const category = await this.categoryDao.getById(categoryId);

            const transfer = new Transfer();
            transfer.amount = amount;
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
                ti.totalSetPrice = roundMoney(item.price * item.quantity);
                ti.totalSetDiscount = 0;
                ti.packagingId = item.packagingId;
                ti.containerId = item.containerId;
                return ti;
            });

            const saved = await this.transfersService.saveTransfer(transfer);
            transferIds.push(saved.id);
        }

        // Update receipt with confirmed data
        receipt.amount = roundMoney(resolvedItems.reduce((sum, i) => sum + roundMoney(i.price * i.quantity), 0));
        receipt.date = date;
        receipt.contractorId = contractor?.id ?? null;
        await this.receiptDao.save(receipt);

        this.logger.log(`Receipt ${id} confirmed: ${transferIds.length} transfer(s) created`);
        return { insertedIds: transferIds };
    }

    @Get(':id/details')
    public async getReceiptDetails(@Param('id', ParseIntPipe) id: number, @RequestingUser('id') userId?: number): Promise<ReceiptDetailsDTO> {
        const receipt = await this.receiptDao.getById(id);

        return {
            id: receipt.id,
            date: receipt.date,
            nextTransferDate: this.getNextTransferDate(receipt.transfers),
            description: receipt.description,
            amount: Number(receipt.amount),
            totalAmount: this.calculateTotalAmount(receipt.transfers, true, userId),
            totalTransferred: this.calculateTotalAmount(receipt.transfers, false, userId),
            contractorId: receipt.contractor?.id ?? null,
            contractorName: receipt.contractor?.name ?? null,
            allTransfers: receipt.transfers.map((t) => this.toTransferDTO(t)),
            tags: getReceiptTags(receipt.transfers),
        };
    }

    private calculateTotalAmount(transfers: Transfer[], withPlanned: boolean, userId?: number): number {
        return Number(
            transfers
                .filter((t) => withPlanned || new Date(t.date) <= new Date())
                .reduce((amount, t) => amount + transferExpenseAmount(t, userId), 0)
                .toFixed(2),
        );
    }

    private toTransferDTO(transfer: Transfer): TransferDTO {
        return {
            id: transfer.id,
            date: transfer.date,
            description: transfer.description,
            amount: Number(transfer.amount),
            currency: transfer.currency.symbol,
            type:
                transfer.originAccount.userId === transfer.targetAccount?.userId
                    ? TransferType.INTERNAL.value
                    : transfer.originAccount.userId === transfer.ownerUserId
                      ? TransferType.OUTCOME.value
                      : TransferType.INCOME.value,
            categoryId: transfer.category.id,
            categoryName: transfer.category.name,
            contractorId: transfer.contractorId ?? null,
            contractorName: transfer.contractor?.name ?? null,
            originAccountId: transfer.originAccount.id,
            originAccountName: transfer.originAccount.name,
            receiptId: transfer.receiptId ?? null,
            isFlagged: transfer.isFlagged,
            tags: getTransferTags(transfer),
        };
    }

    private getNextTransferDate(transfers: Transfer[]): Date | undefined {
        return transfers.find((t) => t.date.getTime() > new Date().getTime())?.date;
    }
}
