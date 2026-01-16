import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ApiService } from '../common/api.service';
import { Landingpage } from './landingpage';

describe('Landingpage', () => {
  let component: Landingpage;
  let fixture: ComponentFixture<Landingpage>;

  const apiServiceMock = {
    createRoom: () => of({ roomId: '123' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landingpage, ReactiveFormsModule],
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Landingpage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
