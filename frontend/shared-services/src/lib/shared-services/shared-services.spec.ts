import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedServices } from './shared-services';

describe('SharedServices', () => {
  let component: SharedServices;
  let fixture: ComponentFixture<SharedServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedServices],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedServices);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
