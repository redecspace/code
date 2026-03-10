export interface GSDataStruct {
  operation: 'compress' | 'merge' | 'split';
  psDataURL?: string;
  files?: string[];
  pdfSetting?: string;
  customCommand?: string | null;
  splitRange?: { startPage: string; endPage: string };
  advancedSettings?: any;
  showTerminalOutput?: boolean;
  showProgressBar?: boolean;
}

export async function _GSPS2PDF(
  dataStruct: GSDataStruct,
  responseCallback?: (data: any) => void,
  progressCallback?: (data: any) => void,
  statusUpdateCallback?: (data: any) => void
): Promise<any> {
  const worker = new Worker(
    new URL('./bg-worker.ts', import.meta.url),
    { type: 'module' }
  );

  worker.postMessage({ target: 'wasm', ...dataStruct });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Processing timeout after 1 hour'));
    }, 3600000); // 1 hour timeout

    const listener = (e: MessageEvent) => {
      // Handle progress updates
      if (e.data.type === 'progress' && progressCallback) {
        progressCallback(e.data.data);
        return; // Don't resolve yet, continue listening
      }

      // Handle final result (with type: 'result' or without type for backwards compatibility)
      if (e.data.type === 'result' || !e.data.type) {
        clearTimeout(timeout);
        const result = e.data.type === 'result' ? e.data.data : e.data;
        
        // If there's a response callback, use it, otherwise resolve the promise
        if (responseCallback) {
          responseCallback(result);
        }
        
        resolve(result);
        worker.removeEventListener('message', listener);
        worker.removeEventListener('error', errorListener);
        setTimeout(() => worker.terminate(), 0);
      }
    };

    const errorListener = (error: ErrorEvent) => {
      clearTimeout(timeout);
      reject(error);
      worker.removeEventListener('message', listener);
      worker.removeEventListener('error', errorListener);
      setTimeout(() => worker.terminate(), 0);
    };

    worker.addEventListener('message', listener);
    worker.addEventListener('error', errorListener);
  });
}
