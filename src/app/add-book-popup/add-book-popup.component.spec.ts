import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBookPopupComponent } from './add-book-popup.component';

describe('AddBookPopupComponent', () => {
  let component: AddBookPopupComponent;
  let fixture: ComponentFixture<AddBookPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBookPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBookPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
