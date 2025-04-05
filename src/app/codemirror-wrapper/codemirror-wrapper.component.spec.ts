import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeMirrorWrapperComponent } from './codemirror-wrapper.component';

describe('CodemirrorWrapperComponent', () => {
  let component: CodeMirrorWrapperComponent;
  let fixture: ComponentFixture<CodeMirrorWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeMirrorWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeMirrorWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
