import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of, tap } from 'rxjs';

import { TuiAppearance, TuiButton, TuiError, TuiTextfield, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiAutoFocus } from '@taiga-ui/cdk';

import { ApiService } from '../common/api.service';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TuiAppearance,
    TuiHeader,
    TuiCardLarge,
    TuiTitle,
    TuiButton,
    TuiError,
    TuiTextfield,
    TuiAutoFocus,
  ],
  templateUrl: './landingpage.html',
  styleUrl: './landingpage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landingpage {
  private readonly apiService = inject(ApiService);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly roomId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  protected createRoom(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.roomId.set(null);

    this.apiService
      .createRoom(this.form.controls.name.value)
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
