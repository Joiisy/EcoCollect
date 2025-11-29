import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminConductoresPage } from './admin-conductores.page';

describe('AdminConductoresPage', () => {
  let component: AdminConductoresPage;
  let fixture: ComponentFixture<AdminConductoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminConductoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
