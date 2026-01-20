import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private readonly document = inject(DOCUMENT);

    readonly current = signal<Theme>(this.getInitialTheme());

    constructor() {
        effect(() => {
            const theme = this.current();
            this.document.documentElement.setAttribute('data-tui-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    toggle(): void {
        this.current.update((theme) => (theme === 'light' ? 'dark' : 'light'));
    }

    private getInitialTheme(): Theme {
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved === 'light' || saved === 'dark') {
            return saved;
        }
        return 'light';
    }
}
