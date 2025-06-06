import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockMovementsHistoryComponent } from './stock-movements-history.component';

describe('StockMovementsHistoryComponent', () => {
  let component: StockMovementsHistoryComponent;
  let fixture: ComponentFixture<StockMovementsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockMovementsHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockMovementsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
