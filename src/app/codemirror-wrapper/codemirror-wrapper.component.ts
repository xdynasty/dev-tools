import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  model,
  OnChanges,
} from '@angular/core';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  keymap,
} from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { json } from '@codemirror/lang-json';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';

@Component({
  selector: 'app-codemirror-wrapper',
  template: `<div #editor></div>`,
})
export class CodeMirrorWrapperComponent
  implements OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild('editor') editorElement?: ElementRef<HTMLDivElement>;
  code = model('');
  @Input() language:
    | 'javascript'
    | 'typescript'
    | 'html'
    | 'css'
    | 'json'
    | 'plaintext' = 'javascript';
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() editable = true;

  private editorView?: EditorView;

  private jsonLinter = linter((view): readonly Diagnostic[] => {
    if (this.language !== 'json') return [];

    const content = view.state.doc.toString();
    if (!content.trim()) return []; // Skip empty or whitespace-only content

    try {
      JSON.parse(content);
      return [];
    } catch (e) {
      const error = e as SyntaxError;
      const match = error.message.match(/at position (\d+)/);
      const pos = match ? parseInt(match[1]) : 0;

      return [
        {
          from: Math.max(0, pos - 1),
          to: pos + 1,
          severity: 'error',
          message: error.message,
        },
      ] as const;
    }
  });

  ngOnDestroy() {
    this.editorView?.destroy();
  }

  ngOnChanges() {
    if (this.editorView) {
      this.updateCode(this.code());
    }
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private getExtensions() {
    const customTheme = EditorView.theme({
      '&': {
        height: '85vh', // Set the desired height
        width: '100%', // Optional: Set the width
      },
      '.cm-scroller': {
        overflow: 'auto', // Ensure scrolling works if content overflows
      },
      '.cm-diagnostic': {
        padding: '3px 6px',
        marginLeft: '6px',
        backgroundColor: '#ff000020',
        border: '1px solid #ff000080',
        borderRadius: '3px',
      },
      '.cm-diagnostic-error': {
        color: '#ff4444',
      },
    });

    const baseExtensions = [
      basicSetup,
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      keymap.of(defaultKeymap),
      this.getLanguageSupport(),
      this.theme === 'dark' ? oneDark : [],
      !this.editable ? EditorView.editable.of(false) : [],
      EditorView.contentAttributes.of({ tabindex: '0' }),
      customTheme,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          this.code.set(update.state.doc.toString());
        }
      }),
    ];

    // Only add JSON linting for JSON language
    if (this.language === 'json') {
      baseExtensions.push(lintGutter(), this.jsonLinter);
    }

    return baseExtensions;
  }

  private initializeEditor() {
    const startState = EditorState.create({
      doc: this.code(),
      extensions: this.getExtensions(),
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
      case 'plaintext':
        return [];
      default:
        return javascript();
    }
  }

  public updateCode(newCode: string) {
    if (this.editorView) {
      // Store the current selection
      const currentSelection = this.editorView.state.selection;

      // Calculate new selection position
      const oldLength = this.editorView.state.doc.length;
      const newLength = newCode.length;

      this.editorView.dispatch({
        changes: {
          from: 0,
          to: oldLength,
          insert: newCode,
        },
        // Preserve selection by moving it if necessary
        selection: {
          anchor: Math.min(currentSelection.main.anchor, newLength),
          head: Math.min(currentSelection.main.head, newLength),
        },
      });
    }
  }
}
