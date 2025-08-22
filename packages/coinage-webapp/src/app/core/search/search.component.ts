import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalSearchResponse } from '@app/interfaces';
import { faBox, faExchangeAlt, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CoinageRoutes } from '../../app-routing/app-routes';
import { SearchService } from '../../services/search.service';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    standalone: false,
})
export class SearchComponent implements OnInit, OnDestroy {
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    public searchQuery = '';
    public searchResults: GlobalSearchResponse | null = null;
    public isLoading = false;
    public showResults = false;
    public searchError: string | null = null;

    // FontAwesome icons
    public searchIcon = faSearch;
    public clearIcon = faTimes;
    public itemIcon = faBox;
    public transferIcon = faExchangeAlt;

    private searchSubject = new Subject<string>();
    private subscription = new Subscription();

    constructor(
        private searchService: SearchService,
        private router: Router,
        private elementRef: ElementRef,
    ) {}

    public ngOnInit(): void {
        this.subscription.add(
            this.searchSubject
                .pipe(
                    debounceTime(1000), // 1 second debounce
                    distinctUntilChanged(),
                    switchMap((query) => {
                        const trimmedQuery = query.trim();

                        // Reset states
                        this.searchError = null;
                        this.searchResults = null;

                        if (trimmedQuery.length === 0) {
                            // Empty query - hide results
                            this.isLoading = false;
                            this.showResults = false;
                            return [];
                        } else if (trimmedQuery.length < 2) {
                            // Too short - show warning
                            this.isLoading = false;
                            this.showResults = true;
                            this.searchError = 'Please enter at least 2 characters to search';
                            return [];
                        } else {
                            // Valid query - start loading
                            this.isLoading = true;
                            this.showResults = true;
                            return this.searchService.globalSearch(trimmedQuery);
                        }
                    }),
                )
                .subscribe({
                    next: (results) => {
                        if (Array.isArray(results) && results.length === 0) {
                            // Empty array from short query or empty query
                            return;
                        }

                        this.searchResults = results;
                        this.isLoading = false;
                        this.searchError = null;
                    },
                    error: (error) => {
                        console.error('Search error:', error);
                        this.searchResults = null;
                        this.isLoading = false;
                        this.searchError = 'An error occurred while searching. Please try again.';
                    },
                }),
        );

        // Close results when clicking outside
        document.addEventListener('click', this.onDocumentClick.bind(this));
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        document.removeEventListener('click', this.onDocumentClick.bind(this));
    }

    public onSearchInput(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchQuery = query;

        // Always trigger the search subject, let the pipeline handle the logic
        this.searchSubject.next(query);
    }

    public onItemClick(itemId: number): void {
        this.hideResults();
        this.router.navigate([CoinageRoutes.TransferItemDetailsPage.getUrl({ id: itemId })]);
    }

    public onTransferClick(transferId: number): void {
        this.hideResults();
        this.router.navigate([CoinageRoutes.TransferDetailsPage.getUrl({ id: transferId })]);
    }

    public onSearchFocus(): void {
        if (this.searchResults && this.searchQuery.trim().length > 0) {
            this.showResults = true;
        }
    }

    public clearSearch(): void {
        this.searchQuery = '';
        this.hideResults();
        this.searchInput.nativeElement.focus();
    }

    private hideResults(): void {
        this.showResults = false;
    }

    private onDocumentClick(event: Event): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.hideResults();
        }
    }
}
