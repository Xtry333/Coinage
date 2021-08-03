import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryDTO, ContractorDTO, SaveTransferDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CoinageDataService } from '../services/coinageData.service';

export interface TransferInput {
    description: string;
    amount: number;
    date: string;
    category?: number;
    contractor?: number;
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
    editMode = false;
    transferDTO!: TransferDetailsDTO;
    transferId!: number;

    @Input()
    redirectAfterSave = true;

    @Input()
    transferInput!: TransferInput;

    @Output()
    saveSuccess: EventEmitter<TransferDTO> = new EventEmitter();

    constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly coinageData: CoinageDataService) {}

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
                    this.transferInput = {
                        amount: t.amount,
                        category: t.categoryId,
                        date: t.date,
                        description: t.description,
                        contractor: t.contractorId ?? undefined,
                    };
                });
            }
        });
        Rx.zip(this.coinageData.getCategoryList(), this.coinageData.getContractorList())
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(([categories, contractors]) => {
                this.categories = categories;
                this.contractors = contractors;
            });
    }

    onClickSaveTransfer(): void {
        console.log(this.transferInput);
        const newTransfer: SaveTransferDTO = {
            id: this.transferId,
            description: this.transferInput.description,
            amount: parseFloat(this.transferInput.amount?.toString()) ?? null,
            categoryId: this.transferInput.category ?? 0,
            contractorId: this.transferInput.contractor ?? 0,
            date: this.transferInput.date,
        };
        this.coinageData.postCreateSaveTransaction(newTransfer).subscribe((result) => {
            console.log(result);
            const cat = this.categories.find((c) => c.id === newTransfer.categoryId);
            if (result.insertedId && cat) {
                this.saveSuccess.emit({ ...newTransfer, id: result.insertedId, category: cat.name, type: '' });
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
                    this.router.navigateByUrl(`/dashboard`);
                }
            });
        }
    }

    public onAddNewCategory = async (name: string): Promise<CategoryDTO> => {
        const response = await this.coinageData.postCreateCategory({ name }).toPromise();
        return { id: response.insertedId ?? 0, name };
    };

    public onAddNewContractor = async (name: string): Promise<ContractorDTO> => {
        const response = await this.coinageData.postCreateContractor({ name }).toPromise();
        return { id: response.insertedId ?? 0, name };
    };

    public onChangeCategory(): void {
        if (this.transferInput.category === 1 && this.transferInput.description === '') {
            this.transferInput.description = CreateEditTransferComponent.FUEL_TEMPLATE;
        }
    }

    get todayInputFormat(): string {
        const today = new Date().toLocaleDateString().split('.');
        return [today[2], today[1], today[0].padStart(2, '0')].join('-');
    }

    public clearInputData(): void {
        this.transferInput = { description: '', amount: 0, date: this.todayInputFormat, category: undefined, contractor: undefined };
    }
}
