// src/app/components/delete-account-modal/delete-account-modal.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="text-red-600 text-xl font-semibold">Delete Account</h2>
        </div>
        
        <div class="modal-body space-y-4">
          <p>This action is permanent and cannot be undone. All your data including:</p>
          <ul class="list-disc pl-6">
            <li>Profile information</li>
            <li>Movie ratings</li>
            <li>Book ratings</li>
            <li>Recommendations</li>
          </ul>
          <p>will be permanently deleted.</p>
          
          <div class="mt-4">
            <p class="font-medium text-sm text-gray-700">Type "delete" to confirm:</p>
            <input
              type="text"
              [(ngModel)]="confirmText"
              class="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type 'delete'"
            >
          </div>
        </div>

        <div class="modal-footer">
          <button 
            (click)="close.emit()"
            [disabled]="isLoading"
            class="cancel-button"
          >
            Cancel
          </button>
          <button
            (click)="confirm.emit()"
            [disabled]="!canDelete || isLoading"
            class="delete-button"
          >
            {{isLoading ? 'Deleting...' : 'Delete Account'}}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .cancel-button {
      padding: 0.5rem 1rem;
      background-color: #f3f4f6;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-button:hover {
      background-color: #e5e7eb;
    }

    .cancel-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .delete-button {
      padding: 0.5rem 1rem;
      background-color: #dc2626;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }

    .delete-button:hover {
      background-color: #b91c1c;
    }

    .delete-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class DeleteAccountModalComponent {
  @Input() isOpen = false;
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  confirmText = '';

  get canDelete(): boolean {
    return this.confirmText.toLowerCase() === 'delete';
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}