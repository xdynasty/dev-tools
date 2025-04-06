import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CodeMirrorWrapperComponent } from './codemirror-wrapper/codemirror-wrapper.component';
import { CommonModule } from '@angular/common';

import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';

interface NetworkInformation {
  readonly downlink: number;
  readonly effectiveType: string;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: string;
  onchange?: () => void;
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
  // webgl: {
  //   supported: boolean;
  //   renderer?: string;
  //   vendor?: string;
  //   webglVersion?: string;
  //   contextAttributes?: WebGLContextAttributes;
  //   extensions?: string[];
  // };
  // media: {
  //   audioSupported: string[];
  //   videoSupported: string[];
  //   mediaDevices: {
  //     audioinput: number;
  //     videoinput: number;
  //     audiooutput: number;
  //   };
  // };
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
  };
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
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
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
    // webgl: (() => {
    //   try {
    //     const canvas = document.createElement('canvas');
    //     const gl = (canvas.getContext('webgl') ||
    //       canvas.getContext(
    //         'experimental-webgl',
    //       )) as WebGLRenderingContext | null;
    //     if (!gl) return { supported: false };

    //     const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    //     return {
    //       supported: true,
    //       renderer: debugInfo
    //         ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    //         : undefined,
    //       vendor: debugInfo
    //         ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    //         : undefined,
    //       webglVersion: gl.getParameter(gl.VERSION),
    //       contextAttributes: gl.getContextAttributes(),
    //       extensions: gl.getSupportedExtensions(),
    //     };
    //   } catch (e) {
    //     return { supported: false };
    //   }
    // })(),
    // media: {
    //   audioSupported: (() => {
    //     const audio = document.createElement('audio');
    //     return ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'].filter(
    //       (type) => {
    //         try {
    //           return audio.canPlayType(type) !== '';
    //         } catch (e) {
    //           return false;
    //         }
    //       },
    //     );
    //   })(),
    //   videoSupported: (() => {
    //     const video = document.createElement('video');
    //     return ['video/mp4', 'video/webm', 'video/ogg'].filter((type) => {
    //       try {
    //         return video.canPlayType(type) !== '';
    //       } catch (e) {
    //         return false;
    //       }
    //     });
    //   })(),
    //   mediaDevices:
    //     typeof navigator !== 'undefined' && navigator.mediaDevices
    //       ? navigator.mediaDevices
    //           .enumerateDevices()
    //           .then((devices) => ({
    //             audioinput: devices.filter((d) => d.kind === 'audioinput')
    //               .length,
    //             videoinput: devices.filter((d) => d.kind === 'videoinput')
    //               .length,
    //             audiooutput: devices.filter((d) => d.kind === 'audiooutput')
    //               .length,
    //           }))
    //           .catch(() => ({
    //             audioinput: 0,
    //             videoinput: 0,
    //             audiooutput: 0,
    //           }))
    //       : {
    //           audioinput: 0,
    //           videoinput: 0,
    //           audiooutput: 0,
    //         },
    // },
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
  };

  objectKeys(obj: ClientInfo): (keyof ClientInfo)[] {
    return Object.keys(obj) as (keyof ClientInfo)[];
  }

  @ViewChild(CodeMirrorWrapperComponent)
  codeMirrorWrapper?: CodeMirrorWrapperComponent;

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

  parseJson(): void {
    try {
      // First unescape the string if it contains escaped quotes
      // eslint-disable-next-line no-useless-escape
      let inputStringUnescaped = this.inputCode.replace(/\\\"/g, '"');
      if (
        inputStringUnescaped.length > 2 &&
        inputStringUnescaped.charAt(0) === '"' &&
        inputStringUnescaped.charAt(inputStringUnescaped.length - 1) === '"'
      ) {
        inputStringUnescaped = inputStringUnescaped.substring(
          1,
          inputStringUnescaped.length - 1,
        );
      }

      // Try to parse the unescaped string
      try {
        const parsedJson = JSON.parse(inputStringUnescaped);
        this.outputCode = JSON.stringify(parsedJson, null, 2);
      } catch (e) {
        // If parsing fails, try to parse with double unescaping
        // eslint-disable-next-line no-useless-escape
        inputStringUnescaped = inputStringUnescaped.replace(/\\\"/g, '"');
        const parsedJson = JSON.parse(inputStringUnescaped);
        this.outputCode = JSON.stringify(parsedJson, null, 2);
      }
    } catch (error) {
      console.error('Invalid or malformed JSON string:', error);
      this.outputCode = 'Invalid or malformed JSON string';
    }
  }
}
