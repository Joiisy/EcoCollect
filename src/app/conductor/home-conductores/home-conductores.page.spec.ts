import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeConductoresPage } from './home-conductores.page';

describe('HomeConductoresPage', () => {
  let component: HomeConductoresPage;
  let fixture: ComponentFixture<HomeConductoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeConductoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
