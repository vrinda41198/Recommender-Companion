import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DeleteAccountModalComponent } from './delete-account-modal.component';

describe('DeleteAccountModalComponent', () => {
  let component: DeleteAccountModalComponent;
  let fixture: ComponentFixture<DeleteAccountModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, DeleteAccountModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccountModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with default values', () => {
    expect(component.isOpen).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(component.confirmText).toBe('');
    expect(component.canDelete).toBeFalse();
  });

  it('should show modal when isOpen is true', () => {
    component.isOpen = true;
    fixture.detectChanges();
    
    const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalOverlay).toBeTruthy();
  });

  it('should hide modal when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();
    
    const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });

  it('should emit close event when clicking overlay', () => {
    spyOn(component.close, 'emit');
    component.isOpen = true;
    fixture.detectChanges();

    const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
    modalOverlay.click();
    
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not emit close event when clicking modal content', () => {
    spyOn(component.close, 'emit');
    component.isOpen = true;
    fixture.detectChanges();

    const modalContent = fixture.nativeElement.querySelector('.modal-content');
    modalContent.click();
    
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should enable delete button only when confirmation text is correct', () => {
    component.isOpen = true;
    fixture.detectChanges();

    // Initially the button should be disabled
    const deleteButton = fixture.nativeElement.querySelector('.delete-button');
    expect(deleteButton.disabled).toBeTrue();

    // Enter incorrect text
    component.confirmText = 'wrong';
    fixture.detectChanges();
    expect(deleteButton.disabled).toBeTrue();

    // Enter correct text
    component.confirmText = 'delete';
    fixture.detectChanges();
    expect(deleteButton.disabled).toBeFalse();
  });

  it('should disable buttons when loading', () => {
    component.isOpen = true;
    component.isLoading = true;
    component.confirmText = 'delete';
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.delete-button');
    const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
    
    expect(deleteButton.disabled).toBeTrue();
    expect(cancelButton.disabled).toBeTrue();
  });

  it('should emit confirm event when clicking delete button', () => {
    spyOn(component.confirm, 'emit');
    component.isOpen = true;
    component.confirmText = 'delete';
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.delete-button');
    deleteButton.click();
    
    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit close event when clicking cancel button', () => {
    spyOn(component.close, 'emit');
    component.isOpen = true;
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
    cancelButton.click();
    
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should handle case-insensitive delete confirmation', () => {
    const testCases = ['delete', 'DELETE', 'Delete', 'dElEtE'];
    
    testCases.forEach(text => {
      component.confirmText = text;
      expect(component.canDelete).toBeTrue();
    });
  });

  it('should show correct button text based on loading state', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.delete-button');
    expect(deleteButton.textContent.trim()).toBe('Delete Account');

    component.isLoading = true;
    fixture.detectChanges();
    expect(deleteButton.textContent.trim()).toBe('Deleting...');
  });
});