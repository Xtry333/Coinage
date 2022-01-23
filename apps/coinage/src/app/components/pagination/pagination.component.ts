import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// interface PageNumber {
//     value: number;
//     isSpacer: boolean;
// }

interface PaginationQueryParams {
    page: number;
    rowsPerPage: number;
}

type PageNumber =
    | {
          value: number;
          isSpacer?: false;
          isActive: boolean;
      }
    | {
          value: undefined;
          isSpacer: true;
          isActive?: false;
      };

@Component({
    selector: 'coinage-app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnInit {
    @Input() firstPage = 1;
    @Input() currentPage = 1;
    @Input() lastPage = 1;

    pageNumbers: PageNumber[] = [{ value: this.firstPage, isActive: false }];

    constructor(private readonly router: Router, private readonly route: ActivatedRoute) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const { page } = params as PaginationQueryParams;
            const currentPageNumber = Number(page);
            if (currentPageNumber > 0 && currentPageNumber <= this.lastPage) {
                this.currentPage = currentPageNumber;
            } else {
                this.currentPage = 1;
                this.goToPage(this.currentPage);
            }
            this.calculatePageNumbers();
        });
    }

    private calculatePageNumbers(showAll: boolean = false) {
        const pageNumbers = new Set<number>([this.firstPage]);
        for (let i = 0; i < (showAll ? this.lastPage : 2); i++) {
            pageNumbers.add(this.firstPage + i);
            pageNumbers.add(this.currentPage + i);
            pageNumbers.add(this.currentPage - i);
            pageNumbers.add(this.lastPage - i);
        }

        const numbers = Array.from(pageNumbers)
            .filter((n) => n >= this.firstPage && n <= this.lastPage)
            .sort((a, b) => a - b);

        for (let i = 0; i < numbers.length - 1; i++) {
            const differenceWithNextNumber = numbers[i + 1] - (numbers[i] + 1);
            if (differenceWithNextNumber === 1) {
                numbers.splice(i + 1, 0, numbers[i] + 1);
                i += 1;
            } else if (differenceWithNextNumber > 1) {
                numbers.splice(i + 1, 0, 0);
                i += 1;
            }
        }

        this.pageNumbers = numbers.map((n) => (n ? { value: n, isActive: n === this.currentPage } : { value: undefined, isSpacer: true }));
    }

    onClickChangePage(event: MouseEvent, pageNumber: PageNumber) {
        if (!pageNumber.isSpacer) {
            this.currentPage = pageNumber.value;
            this.goToPage(pageNumber.value);
            this.calculatePageNumbers();
        } else {
            this.calculatePageNumbers(true);
        }
    }

    private goToPage(pageNumber: number) {
        this.router.navigate([], {
            queryParams: {
                page: pageNumber,
            },
        });
    }
}
