import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedTheme } from './shared-theme';

describe('SharedTheme', () => {
  let component: SharedTheme;
  let fixture: ComponentFixture<SharedTheme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedTheme],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedTheme);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
