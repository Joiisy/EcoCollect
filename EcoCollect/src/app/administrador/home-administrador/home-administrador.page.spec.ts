import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeAdministradorPage } from './home-administrador.page';

describe('HomeAdministradorPage', () => {
  let component: HomeAdministradorPage;
  let fixture: ComponentFixture<HomeAdministradorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeAdministradorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
