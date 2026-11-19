import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagBadgesComponent } from './tag-badges.component';

describe('TagBadgesComponent', () => {
    let fixture: ComponentFixture<TagBadgesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ declarations: [TagBadgesComponent] }).compileComponents();
        fixture = TestBed.createComponent(TagBadgesComponent);
    });

    it('renders each tag ID once with inheritance shown only on hover', () => {
        const tag = { id: 1, name: 'Holiday', color: null, isDirect: false, isInherited: true };
        fixture.componentInstance.tags = [tag, { ...tag }];
        fixture.detectChanges();
        const badges = fixture.nativeElement.querySelectorAll('[title]');
        expect(badges).toHaveLength(1);
        expect(badges[0].title).toBe('Holiday (inherited)');
        expect(badges[0].textContent.trim()).toBe('Holiday');
    });

    it('shows inheritance only on hover for tags with both direct and inherited assignments', () => {
        fixture.componentInstance.tags = [{ id: 1, name: 'Holiday', color: null, isDirect: true, isInherited: true }];
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector('[title]');
        expect(badge.title).toBe('Holiday (inherited)');
        expect(badge.textContent.trim()).toBe('Holiday');
    });

    it('shows inheritance only on hover for receipt tags', () => {
        fixture.componentInstance.receipt = true;
        fixture.componentInstance.tags = [{ id: 1, name: 'Holiday', color: null, isDirect: false, isInherited: true }];
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector('[title]');
        expect(badge.title).toBe('Holiday (inherited)');
        expect(badge.textContent.trim()).toBe('Holiday');
    });

    it('does not mark directly assigned tags as inherited', () => {
        fixture.componentInstance.tags = [{ id: 1, name: 'Holiday', color: null }];
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector('[title]');
        expect(badge.title).toBe('Directly assigned tag.');
        expect(badge.textContent.trim()).toBe('Holiday');
    });

    it('describes direct receipt tags as assignments to transfers, not to the receipt', () => {
        fixture.componentInstance.receipt = true;
        fixture.componentInstance.tags = [{ id: 1, name: 'Holiday', color: null, isDirect: true, isInherited: false }];
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[title]').title).toContain('transfer in this receipt');
        expect(fixture.nativeElement.textContent).not.toContain('(inherited)');
    });
});
