import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryDTO, ContractorDTO, TransferDetailsDTO, TransferDTO } from '@coinage-app/interfaces';
import * as Rx from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CoinageDataService } from '../services/coinageData.service';

@Component({
    selector: 'coinage-app-create-transfer',
    templateUrl: './create-transfer.component.html',
    styleUrls: ['./create-transfer.component.less'],
})
export class CreateTransferComponent implements OnInit {
    showPage = true;
    totalPayment: number;
    categories: CategoryDTO[];
    contractors: ContractorDTO[];
    editMode = false;
    transferDTO: TransferDetailsDTO;
    transferId: number;

    @Input('transfer')
    transferInput = { description: '', amount: 0, date: new Date().toISOString().slice(0, 10), category: 0, contractor: 0 };

    constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.params.subscribe((r) => {
            const id = parseInt(r.id);
            if (id) {
                this.transferId = id;
                this.coinageData.getTransferDetails(id).then((t) => {
                    this.transferDTO = t;
                    this.editMode = true;
                    this.transferInput = {
                        amount: t.amount,
                        category: t.categoryPath[t.categoryPath.length - 1].id,
                        date: t.date,
                        description: t.description,
                        contractor: t.contractorId,
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
        this.coinageData
            .postCreateSaveTransaction({
                id: this.transferId,
                description: this.transferInput.description,
                amount: parseFloat(this.transferInput.amount?.toString()) ?? null,
                categoryId: this.transferInput.category,
                contractorId: this.transferInput.contractor,
                date: this.transferInput.date,
            })
            .subscribe((result) => {
                console.log(result);
                this.router.navigateByUrl(`/details/${(result as any).insertedId}`);
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
}
