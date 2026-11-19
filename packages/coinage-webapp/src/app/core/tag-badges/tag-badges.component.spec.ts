import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagBadgesComponent } from './tag-badges.component';

describe('TagBadgesComponent', () => {
    let fixture: ComponentFixture<TagBadgesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ declarations: [TagBadgesComponent] }).compileComponents();
        fixture = TestBed.createComponent(TagBadgesComponent);
    });

    it('renders each tag ID once and explains inheritance on hover', () => {
        const tag = { id: 1, name: 'Holiday', color: null, isDirect: false, isInherited: true };
        fixture.componentInstance.tags = [tag, { ...tag }];
        fixture.detectChanges();
        const badges = fixture.nativeElement.querySelectorAll('[title]');
        expect(badges).toHaveLength(1);
        expect(badges[0].title).toContain('Inherited from items');
        expect(badges[0].textContent).toContain('(inherited)');
    });

    it('explains why a tag remains after removing its direct assignment', () => {
        fixture.componentInstance.tags = [{ id: 1, name: 'Holiday', color: null, isDirect: true, isInherited: true }];
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[title]').title).toContain('Removing the direct assignment leaves the inherited tag');
    });

    it('describes direct receipt tags as assignments to transfers, not to the receipt', () => {
        fixture.componentInstance.receipt = true;
        fixture.componentInstance.tags = [{ id: 1, name: 'Holiday', color: null, isDirect: true, isInherited: false }];
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[title]').title).toContain('transfer in this receipt');
        expect(fixture.nativeElement.textContent).not.toContain('(inherited)');
    });
});
