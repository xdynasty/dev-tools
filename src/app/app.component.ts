import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CodeMirrorWrapperComponent } from './codemirror-wrapper/codemirror-wrapper.component';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';

import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { Observable, of } from 'rxjs';
import { DiffViewerComponent } from './diff-viewer/diff-viewer.component';

import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
interface NetworkInformation {
  readonly downlink: number;
  readonly effectiveType: string;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: string;
  onchange?: () => void;
}

interface BatteryInfo {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    deviceMemory?: number;
    getBattery?: () => Promise<BatteryManager>;
  }

  interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  }
}

interface ClientInfo {
  browser: {
    userAgent: string;
    language: string;
    languages: readonly string[];
    cookieEnabled: boolean;
    doNotTrack: string | null;
    maxTouchPoints: number;
    platform: string;
    vendor: string;
    product: string;
    appVersion: string;
    appName: string;
    buildID?: string;
    plugins: string[];
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
    orientation: string | undefined;
  };
  hardware: {
    hardwareConcurrency: number;
    deviceMemory: number | undefined;
  };
  network: {
    downlink: number;
    effectiveType: string;
    rtt: number;
    saveData: boolean;
  } | null;
  time: {
    timezone: string;
    locale: string;
  };
  performance: {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
    navigation?: {
      type: number;
      redirectCount: number;
    };
    timing?: {
      loadEventEnd: number;
      loadEventStart: number;
      domContentLoadedEventEnd: number;
      domContentLoadedEventStart: number;
      navigationStart: number;
    };
  };
  webgl: {
    supported: boolean;
    renderer?: string;
    vendor?: string;
    webglVersion?: string;
    contextAttributes?: WebGLContextAttributes;
    extensions?: string[] | null;
  };
  media: {
    audioSupported: string[];
    videoSupported: string[];
    mediaDevices:
      | Promise<{
          audioinput: number;
          videoinput: number;
          audiooutput: number;
        }>
      | Observable<{
          audioinput: number;
          videoinput: number;
          audiooutput: number;
        }>;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    cookiesEnabled: boolean;
  };
  location: {
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    online: boolean;
    localIPs?: string[];
  };
  battery: Promise<BatteryInfo> | null;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    RouterOutlet,
    MatTabsModule,
    RouterModule,
    CodeMirrorWrapperComponent,
    MatButtonModule,
    CommonModule,
    DiffViewerComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    DatePipe,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dev-tools';
  activeTabIndex = 0;
  outputCode = '';
  inputCode = `{
  "name": "Example",
  "data": {
    "nested": true,
    "array": [1, 2, 3]
  }
  }`;
  epochMilliseconds = new Date().getTime();
  timeFormats = {
    long: 'yyyy-MM-dd HH:mm:ss',
    gmt: "yyyy-MM-dd HH:mm:ss 'GMT'",
    twelve: 'yyyy-MM-dd hh:mm:ss a', // Add 12-hour format with AM/PM
    short: 'short',
    medium: 'medium',
  };

  currentTime: number = Date.now(); // Changed to use milliseconds
  private timeInterval?: number;

  clientInfo: ClientInfo = {
    browser: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      language: typeof navigator !== 'undefined' ? navigator.language : '',
      languages: typeof navigator !== 'undefined' ? navigator.languages : [],
      cookieEnabled:
        typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
      doNotTrack:
        typeof navigator !== 'undefined' ? navigator.doNotTrack : null,
      maxTouchPoints:
        typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
      platform: typeof navigator !== 'undefined' ? navigator.platform : '',
      vendor: typeof navigator !== 'undefined' ? navigator.vendor : '',
      product: typeof navigator !== 'undefined' ? navigator.product : '',
      appVersion: typeof navigator !== 'undefined' ? navigator.appVersion : '',
      appName: typeof navigator !== 'undefined' ? navigator.appName : '',

      plugins:
        typeof navigator !== 'undefined' && navigator.plugins
          ? Array.from(navigator.plugins).map((p) => p.name)
          : [],
    },
    screen: {
      width: typeof window !== 'undefined' ? window.screen.width : 0,
      height: typeof window !== 'undefined' ? window.screen.height : 0,
      colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth : 0,
      pixelDepth: typeof window !== 'undefined' ? window.screen.pixelDepth : 0,
      orientation:
        typeof screen !== 'undefined' ? screen.orientation?.type : undefined,
    },
    hardware: {
      hardwareConcurrency:
        typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0,
      deviceMemory:
        typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined,
    },
    network:
      typeof navigator !== 'undefined' && navigator.connection
        ? {
            downlink: navigator.connection.downlink,
            effectiveType: navigator.connection.effectiveType,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData,
          }
        : null,
    time: {
      timezone:
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : '',
      locale:
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().locale
          : '',
    },
    performance: {
      memory:
        typeof performance !== 'undefined' && (performance as any).memory
          ? {
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            }
          : undefined,
      navigation:
        typeof performance !== 'undefined' && performance.navigation
          ? {
              type: performance.navigation.type,
              redirectCount: performance.navigation.redirectCount,
            }
          : undefined,
      timing:
        typeof performance !== 'undefined' && performance.timing
          ? {
              loadEventEnd: performance.timing.loadEventEnd,
              loadEventStart: performance.timing.loadEventStart,
              domContentLoadedEventEnd:
                performance.timing.domContentLoadedEventEnd,
              domContentLoadedEventStart:
                performance.timing.domContentLoadedEventStart,
              navigationStart: performance.timing.navigationStart,
            }
          : undefined,
    },
    webgl: (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') ||
          canvas.getContext(
            'experimental-webgl',
          )) as WebGLRenderingContext | null;

        if (!gl) {
          return {
            supported: false,
            renderer: undefined,
            vendor: undefined,
            webglVersion: undefined,
            contextAttributes: undefined,
            extensions: undefined,
          };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          supported: true,
          renderer: debugInfo
            ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
            : undefined,
          vendor: debugInfo
            ? (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string)
            : undefined,
          webglVersion: gl.getParameter(gl.VERSION) as string,
          contextAttributes: gl.getContextAttributes() || undefined,
          extensions: gl.getSupportedExtensions(),
        };
      } catch (e) {
        return {
          supported: false,
          renderer: undefined,
          vendor: undefined,
          webglVersion: undefined,
          contextAttributes: undefined,
          extensions: undefined,
        };
      }
    })(),
    media: {
      audioSupported: (() => {
        if (typeof document === 'undefined') return [];
        const audio = document.createElement('audio');
        return ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'].filter(
          (type) => {
            try {
              return audio.canPlayType(type) !== '';
            } catch (e) {
              return false;
            }
          },
        );
      })(),
      videoSupported: (() => {
        if (typeof document === 'undefined') return [];
        const video = document.createElement('video');
        return ['video/mp4', 'video/webm', 'video/ogg'].filter((type) => {
          try {
            return video.canPlayType(type) !== '';
          } catch (e) {
            return false;
          }
        });
      })(),
      mediaDevices:
        typeof navigator !== 'undefined' && navigator.mediaDevices
          ? navigator.mediaDevices
              .enumerateDevices()
              .then((devices) => ({
                audioinput: devices.filter((d) => d.kind === 'audioinput')
                  .length,
                videoinput: devices.filter((d) => d.kind === 'videoinput')
                  .length,
                audiooutput: devices.filter((d) => d.kind === 'audiooutput')
                  .length,
              }))
              .catch(() => ({
                audioinput: 0,
                videoinput: 0,
                audiooutput: 0,
              }))
          : of({
              audioinput: 0,
              videoinput: 0,
              audiooutput: 0,
            }),
    },
    storage: {
      localStorage: (() => {
        try {
          return typeof localStorage !== 'undefined';
        } catch (e) {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          return typeof sessionStorage !== 'undefined';
        } catch (e) {
          return false;
        }
      })(),
      cookiesEnabled: navigator.cookieEnabled,
    },
    location:
      typeof window !== 'undefined'
        ? {
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port,
            pathname: window.location.pathname,
            online: navigator.onLine,
          }
        : {
            protocol: '',
            hostname: '',
            port: '',
            pathname: '',
            online: false,
          },
    battery:
      typeof navigator !== 'undefined' && navigator.getBattery
        ? navigator.getBattery().then((battery) => ({
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            level: battery.level,
          }))
        : null,
  };

  showCopied = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  objectKeys(obj: ClientInfo): (keyof ClientInfo)[] {
    return Object.keys(obj) as (keyof ClientInfo)[];
  }

  @ViewChild(CodeMirrorWrapperComponent)
  codeMirrorWrapper?: CodeMirrorWrapperComponent;

  @ViewChild(DiffViewerComponent)
  diffViewer?: DiffViewerComponent;

  onTabChange(e: MatTabChangeEvent) {
    this.activeTabIndex = e.index;
    this.outputCode = '';
  }

  minimize(): void {
    console.log('multilinetoSingleline');
    const outputCode = this.inputCode;
    console.log('outputCode:', outputCode);
    if (outputCode) {
      this.outputCode = outputCode
        .replace(/(?:\r\n|\r|\n)/g, ' ') // Replace newlines with spaces
        .replace(
          /("[^"]*"|'[^']*')|\s+/g,
          (match, quoted) => (quoted ? quoted : ''), // Keep spaces inside strings, remove others
        )
        .trim();
    } else {
      this.outputCode = '';
    }
  }

  getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, this.getCircularReplacer(), 2);
    } catch (error) {
      console.error('JSON stringify error:', error);
      return '{}';
    }
  }

  stringify(): void {
    try {
      // Parse input first to validate it's proper JSON
      const parsed = JSON.parse(this.inputCode);
      // Convert to string with escaped quotes
      this.outputCode = JSON.stringify(JSON.stringify(parsed));
    } catch (error) {
      console.error('Error converting JSON to string:', error);
      this.outputCode = 'Invalid JSON input';
    }
  }

  formatJson(): void {
    try {
      const input = this.inputCode.trim();
      let result;

      // Handle empty input
      if (!input) {
        this.outputCode = '';
        return;
      }

      try {
        // First try parsing as a JSON string (handles escaped quotes)
        if (input.startsWith('"') && input.endsWith('"')) {
          const unescaped = input.slice(1, -1).replace(/\\"/g, '"');
          result = JSON.parse(unescaped);
        } else {
          // Try parsing as regular JSON
          result = JSON.parse(input);
        }

        // Pretty print the result
        this.outputCode = JSON.stringify(result, null, 2);
      } catch (e) {
        const error = e as Error;
        this.outputCode = `Error: ${error.message}`;
      }
    } catch (error) {
      const err = error as Error;
      this.outputCode = `Error: ${err.message}`;
    }
  }

  parseJson(): void {
    try {
      const input = this.inputCode.trim();

      // Handle empty input
      if (!input) {
        this.outputCode = '';
        return;
      }

      // Check if input is a JSON string (starts and ends with quotes)
      if (!input.startsWith('"') || !input.endsWith('"')) {
        this.outputCode =
          'Error: Input must be a JSON string starting and ending with double quotes';
        return;
      }

      try {
        // First parse the string to handle escaped quotes
        const parsed = JSON.parse(input);
        // Then parse the resulting string as JSON
        const result = JSON.parse(parsed);
        // Pretty print the result
        this.outputCode = JSON.stringify(result, null, 2);
      } catch (e) {
        const error = e as Error;
        this.outputCode = `Error: ${error.message}`;
      }
    } catch (error) {
      const err = error as Error;
      this.outputCode = `Error: ${err.message}`;
    }
  }

  private async getLocalIPs(): Promise<string[]> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      console.warn('RTCPeerConnection is not available');
      return [];
    }

    const ips = new Set<string>();

    try {
      const pc = new window.RTCPeerConnection({
        iceCandidatePoolSize: 1,
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.addEventListener('icecandidate', (e) => {
        if (!e.candidate) return;

        const ipMatch =
          /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g.exec(
            e.candidate.candidate,
          );

        if (ipMatch) {
          ips.add(ipMatch[1]);
        }
      });

      // Create a data channel to trigger candidate generation
      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for all candidates
      await new Promise((resolve) => setTimeout(resolve, 1000));

      pc.close();
      return Array.from(ips);
    } catch (err) {
      console.error('Error getting local IPs:', err);
      return [];
    }
  }

  async copyToClipboard(text: number, event?: KeyboardEvent) {
    // Only handle Enter or Space key, or click events
    if (event && !['Enter', 'Space'].includes(event.code)) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text.toString());
      this.showCopied = true;
      setTimeout(() => (this.showCopied = false), 2000); // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const localIPs = await this.getLocalIPs();
        this.clientInfo.location = {
          ...this.clientInfo.location,
          localIPs,
        };

        // Update timer to use milliseconds
        this.timeInterval = window.setInterval(() => {
          this.currentTime = Date.now();
        }, 1000);
      } catch (error) {
        console.error('Error initializing:', error);
      }
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }
}
