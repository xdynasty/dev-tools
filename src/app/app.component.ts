import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CodeMirrorWrapperComponent } from './codemirror-wrapper/codemirror-wrapper.component';

import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    RouterOutlet,
    MatTabsModule,
    RouterModule,
    CodeMirrorWrapperComponent,
  ],
})
export class AppComponent {
  title = 'dev-tools';
  activeTabIndex = 0;

  onTabChange(e: MatTabChangeEvent) {
    this.activeTabIndex = e.index;
  }

  initialCode = `// TypeScript code example
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}`;
}
