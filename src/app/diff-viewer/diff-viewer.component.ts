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
      // .cm-mergeView {
      //   height: 85vh;
      //   overflow: scroll;
      // }
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
    const customTheme = EditorView.theme({
      '&': {
        height: '100%', // Set the desired height
        width: '100%', // Optional: Set the width
      },
      '.cm-mergeView & .cm-scroller, .cm-mergeView &': {
        height: '85vh !important',
      },
      '.cm-scroller': {
        overflow: 'auto', // Ensure scrolling works if content overflows
      },
    });

    // Add scroll sync extension
    const scrollSync = EditorView.updateListener.of((update) => {
      if (update.view && this.mergeView && update.docChanged === false) {
        const isViewA = update.view === this.mergeView.a;
        const sourceView = isViewA ? this.mergeView.a : this.mergeView.b;
        const targetView = isViewA ? this.mergeView.b : this.mergeView.a;

        const sourceScroll = sourceView.scrollDOM.scrollTop;
        if (targetView.scrollDOM.scrollTop !== sourceScroll) {
          targetView.scrollDOM.scrollTop = sourceScroll;
        }
      }
    });
    const sharedExtensions = [
      basicSetup,
      oneDark,
      EditorView.editable.of(true),
      EditorState.allowMultipleSelections.of(true),
      customTheme,
      EditorView.lineWrapping,
      // scrollSync,
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
