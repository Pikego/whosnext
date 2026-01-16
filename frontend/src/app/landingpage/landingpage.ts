import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiError, TuiTextfield } from '@taiga-ui/core';
import { TuiFieldErrorPipe } from '@taiga-ui/kit';
import { catchError, finalize, of, tap } from 'rxjs';

import { ApiService } from '../common/api.service';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TuiButton, TuiError, TuiTextfield],
  templateUrl: './landingpage.html',
  styleUrl: './landingpage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landingpage {
  private readonly apiService = inject(ApiService);

  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly roomId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  protected createRoom(): void {
    if (this.nameControl.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.roomId.set(null);

    this.apiService
      .createRoom(this.nameControl.value)
      .pipe(
        tap(({ roomId }) => {
          this.roomId.set(roomId);
        }),
        catchError((error) => {
          console.error('Error creating room', error);
          this.errorMessage.set('Failed to create room. Please try again.');
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }
}
