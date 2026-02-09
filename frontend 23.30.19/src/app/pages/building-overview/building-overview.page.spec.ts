import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuildingOverviewPage } from './building-overview.page';

describe('BuildingOverviewPage', () => {
  let component: BuildingOverviewPage;
  let fixture: ComponentFixture<BuildingOverviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildingOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
