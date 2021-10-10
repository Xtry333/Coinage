import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountDTO, CategoryDTO, ContractorDTO, SaveTransferDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import { NgSelectComponent } from '@ng-select/ng-select';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CoinageDataService } from '../services/coinageData.service';
import { NotificationService } from '../services/notification.service';

export interface NewTransferObject {
    description: string;
    amount: number;
    date: string;
    categoryId?: number;
    contractorId?: number;
    accountId?: number;
}

@Component({
    selector: 'coinage-app-create-transfer',
    templateUrl: './create-edit-transfer.component.html',
    styleUrls: ['./create-edit-transfer.component.scss'],
})
export class CreateEditTransferComponent implements OnInit {
    public static FUEL_TEMPLATE = 'Paliwo x,xx PLN/L Miejsce';

    showPage = true;
    totalPayment = 0;
    categories: CategoryDTO[] = [];
    contractors: ContractorDTO[] = [];
    accounts: AccountDTO[] = [];
    editMode = false;
    transferDTO!: TransferDetailsDTO;
    transferId!: number;

    @ViewChildren('categorySelect')
    private categorySelect?: QueryList<NgSelectComponent>;

    @ViewChildren('contractorSelect')
    private contractorSelect?: QueryList<NgSelectComponent>;

    @Input() redirectAfterSave = true;
    @Input() selectedTransferInputs!: NewTransferObject;

    @Output() saveSuccess: EventEmitter<TransferDTO> = new EventEmitter();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.showPage = false;
        this.clearInputData();
        this.route.params.subscribe((r) => {
            const id = parseInt(r.id);
            if (id) {
                this.transferId = id;
                this.coinageData.getTransferDetails(id).then((t) => {
                    this.transferDTO = t;
                    this.editMode = true;
                    this.selectedTransferInputs = {
                        amount: t.amount,
                        categoryId: t.categoryId,
                        date: t.date,
                        description: t.description,
                        contractorId: t.contractorId ?? undefined,
                        accountId: t.account.id,
                    };
                });
            }
        });
        Rx.zip(this.coinageData.getCategoryList(), this.coinageData.getContractorList(), this.coinageData.getAllAvailableAccounts())
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(([categories, contractors, accounts]) => {
                this.categories = categories;
                this.contractors = contractors;
                this.accounts = accounts;
            });
    }

    onClickSaveTransfer(): void {
        console.log(this.selectedTransferInputs);
        const newTransfer: SaveTransferDTO = {
            id: this.transferId,
            description: this.selectedTransferInputs.description,
            amount: parseFloat(this.selectedTransferInputs.amount?.toString()) ?? null,
            categoryId: this.selectedTransferInputs.categoryId ?? 0,
            contractorId: this.selectedTransferInputs.contractorId ?? 0,
            accountId: this.selectedTransferInputs.accountId ?? 0,
            date: this.selectedTransferInputs.date,
        };
        this.coinageData.postCreateSaveTransaction(newTransfer).subscribe((result) => {
            console.log(result);
            const cat = this.categories.find((c) => c.id === newTransfer.categoryId);
            if (result.insertedId && cat) {
                this.saveSuccess.emit({ ...newTransfer, id: result.insertedId, category: cat.name, type: '' });
                this.notificationService.push({ title: `Transfer ${this.editMode ? 'Saved' : 'Added'}`, message: newTransfer.description });
                this.clearInputData();
            }
            if (this.redirectAfterSave) {
                this.router.navigateByUrl(`/details/${result.insertedId}`);
            }
        });
    }

    public onClickDeleteTransfer(): void {
        if (confirm('Are you sure you want to delete this transfer?')) {
            this.coinageData.deleteTransfer(this.transferId).subscribe((result) => {
                if (result) {
                    this.notificationService.push({
                        title: `Transfer Removed`,
                        message: `Transfer with ${this.selectedTransferInputs.description} has been deleted.`,
                    });
                    this.router.navigateByUrl(`/dashboard`);
                }
            });
        }
    }

    public onAddNewCategory = async (name: string): Promise<CategoryDTO> => {
        const response = await this.coinageData.postCreateCategory({ name }).toPromise();
        this.notificationService.push({ title: `Category Created`, message: name });
        return { id: response.insertedId ?? 0, name };
    };

    public onAddNewContractor = async (name: string): Promise<ContractorDTO> => {
        const response = await this.coinageData.postCreateContractor({ name }).toPromise();
        this.notificationService.push({ title: `Contractor Created`, message: name });
        return { id: response.insertedId ?? 0, name };
    };

    public onChangeCategory(): void {
        if (this.selectedTransferInputs.categoryId === 1 && this.selectedTransferInputs.description === '') {
            this.selectedTransferInputs.description = CreateEditTransferComponent.FUEL_TEMPLATE;
        }
    }

    get todayInputFormat(): string {
        const today = new Date().toLocaleDateString().split('.');
        return [today[2], today[1], today[0].padStart(2, '0')].join('-');
    }

    public clearInputData(): void {
        this.selectedTransferInputs = { description: '', amount: 0, date: this.todayInputFormat, categoryId: undefined, contractorId: undefined, accountId: 1 };
        this.categorySelect?.first.handleClearClick();
        this.contractorSelect?.first.handleClearClick();
    }
}
