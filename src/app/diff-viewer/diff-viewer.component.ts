import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { MergeView } from '@codemirror/merge';

@Component({
  selector: 'app-diff-viewer',
  template: `<div #diffContainer class="diff-container"></div>`,
  styles: [
    `
      .diff-container {
        flex: 1;
        min-height: 0;
        border: 1px solid #333;
        border-radius: 4px;
        height: 100%;
      }
      .cm-mergeView {
        height: 800px;
      }
    `,
  ],
})
export class DiffViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diffContainer') diffContainer!: ElementRef<HTMLDivElement>;
  private mergeView?: MergeView;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupMergeView();
    }
  }

  private setupMergeView() {
    const sharedExtensions = [
      basicSetup,
      oneDark,
      EditorView.editable.of(true),
      EditorState.allowMultipleSelections.of(true),
    ];

    const sampleTextA = `# Example Document

This is a sample text showing differences.
Line that is the same in both.
This line will be different in version B.
Another shared line between versions.
A unique line in version A.
Final line that matches.`;

    const sampleTextB = `# Example Document

This is a modified sample showing changes.
Line that is the same in both.
This line has been modified to show differences.
Another shared line between versions.
A new line only in version B.
Final line that matches.`;

    this.mergeView = new MergeView({
      parent: this.diffContainer.nativeElement,
      a: {
        doc: sampleTextA,
        extensions: sharedExtensions,
      },
      b: {
        doc: sampleTextB,
        extensions: sharedExtensions,
      },
      revertControls: 'a-to-b',
      highlightChanges: true,
    });
  }

  ngOnDestroy() {
    this.mergeView?.destroy();
  }
}
