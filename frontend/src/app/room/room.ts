import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WsService } from '../common/ws.service';

interface User {
  id: string;
  name: string;
  isVacation: boolean;
  hasWon?: boolean;
}

@Component({
  selector: 'app-room',
  imports: [ReactiveFormsModule],
  templateUrl: './room.html',
  styleUrl: './room.scss',
})
export class Room implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly ws = inject(WsService);

  readonly roomId = signal<string>('');
  readonly users = signal<User[]>([]);
  readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly isLotteryRunning = signal<boolean>(false);
  readonly winner = signal<User | null>(null);
  readonly currentlyDisplayedName = signal<string | null>(null);

  private lotteryInterval: any;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }
      this.roomId.set(id);
      this.ws.connect(id);

      this.ws.on<User[]>('ROOM_STATE').subscribe((users) => {
        this.users.set(users);
      });

      this.ws.on<void>('LOTTERY_STARTED').subscribe(() => {
        this.startLotteryAnimation();
      });

      this.ws.on<User>('WINNER_SELECTED').subscribe((winner) => {
        this.stopLotteryAnimation(winner);
      });

      this.ws.on<User>('USER_UPDATED').subscribe((updatedUser) => {
        this.users.update((users) => users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      });
    });
  }

  addUser(): void {
    if (this.nameControl.invalid) {
      return;
    }
    const name = this.nameControl.value;
    this.ws.send('ADD_USER', { name });
    this.nameControl.reset();
  }

  removeUser(id: string): void {
    this.ws.send('DELETE_USER', { id });
  }

  toggleVacation(user: User): void {
    this.ws.send('USER_VACATION', { id: user.id, isVacation: !user.isVacation });
  }

  toggleWinner(user: User): void {
    this.ws.send('USER_WON', { id: user.id, hasWon: !user.hasWon });
  }

  startLottery(): void {
    this.ws.send('DRAW', {});
  }

  private startLotteryAnimation(): void {
    this.isLotteryRunning.set(true);
    this.winner.set(null);
    this.currentlyDisplayedName.set(null);

    if (this.lotteryInterval) {
      clearInterval(this.lotteryInterval);
    }

    this.lotteryInterval = setInterval(() => {
      const users = this.users().filter((u) => !u.isVacation);
      if (users.length > 0) {
        const randomIndex = Math.floor(Math.random() * users.length);
        this.currentlyDisplayedName.set(users[randomIndex].name);
      }
    }, 100);
  }

  private stopLotteryAnimation(winner: User): void {
    if (this.lotteryInterval) {
      clearInterval(this.lotteryInterval);
      this.lotteryInterval = null;
    }
    this.isLotteryRunning.set(false);
    this.winner.set(winner);
    this.currentlyDisplayedName.set(winner.name);
  }

  ngOnDestroy(): void {
    if (this.lotteryInterval) {
      clearInterval(this.lotteryInterval);
    }
    this.ws.close();
  }
}
