import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

@Component({
  selector: 'app-codemirror-wrapper',
  template: `<div #editor></div>`,
  styles: [
    `
      div {
        height: 100%;
      }
    `,
  ],
})
export class CodeMirrorWrapperComponent implements OnDestroy, AfterViewInit {
  @ViewChild('editor') editorElement?: ElementRef<HTMLDivElement>;
  @Input() code = '// Your code here\n';
  @Input() language = 'javascript';
  @Input() theme: 'light' | 'dark' = 'light';

  private editorView?: EditorView;

  ngOnDestroy() {
    this.editorView?.destroy();
  }

  ngAfterViewInit() {
    // console.log(this.editorElement!.nativeElement);
    this.initializeEditor();
  }

  private initializeEditor() {
    const startState = EditorState.create({
      doc: this.code,
      extensions: [
        lineNumbers(),
        keymap.of(defaultKeymap),
        this.getLanguageSupport(),
        this.theme === 'dark' ? oneDark : [],
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.code = update.state.doc.toString();
          }
        }),
      ],
    });
    // this condition is required because CodeMirror tries to access the document object during server-side rendering (SSR) or in environments
    // where the DOM isn't available.
    if (typeof document !== 'undefined') {
      this.editorView = new EditorView({
        state: startState,
        parent: this.editorElement!.nativeElement,
      });
    }
  }

  private getLanguageSupport() {
    switch (this.language) {
      case 'javascript':
        return javascript();
      case 'typescript':
        return javascript({ typescript: true });
      case 'html':
        return html();
      case 'css':
        return css();
      case 'json':
        return json();
      default:
        return javascript();
    }
  }

  public updateCode(newCode: string) {
    if (this.editorView) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: newCode,
        },
      });
    }
  }
}
