/* eslint-disable @typescript-eslint/no-explicit-any */

async function loadScript() {
  // Use a dynamic import for the Emscripten-generated script
  await import("./gs-worker.js" as any);
}

/**
 * Utility function to parse command arguments properly
 */
function parseCommandArgs(commandStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < commandStr.length; i++) {
    const char = commandStr[i];
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        args.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}

/**
 * Function to build advanced Ghostscript arguments
 */
function buildAdvancedArgs(advancedSettings: any, baseArgs: string[]): string[] {
  let args = [...baseArgs];
  
  if (!advancedSettings) {
    return args;
  }
  
  // Add compatibility level
  const compatIndex = args.findIndex(arg => arg.startsWith('-dCompatibilityLevel='));
  if (compatIndex >= 0) {
    args[compatIndex] = `-dCompatibilityLevel=${advancedSettings.compatibilityLevel}`;
  } else {
    args.splice(2, 0, `-dCompatibilityLevel=${advancedSettings.compatibilityLevel}`);
  }
  
  // Color image settings
  if (advancedSettings.colorImageSettings) {
    const colorSettings = advancedSettings.colorImageSettings;
    
    // Add downsample setting
    if (colorSettings.downsample !== undefined) {
      args.splice(-1, 0, `-dDownsampleColorImages=${colorSettings.downsample}`);
    }
    
    // Add resolution only if downsampling is enabled and resolution is specified
    if (colorSettings.downsample && colorSettings.resolution) {
      args.splice(-1, 0, `-dColorImageResolution=${colorSettings.resolution}`);
    }
  }
  
  return args;
}

/**
 * Utility function to validate arguments
 */
function validateArgs(args: string[]): boolean {
  if (!args || args.length === 0) {
    throw new Error('No arguments provided');
  }
  
  // Check for required Ghostscript parameters
  const hasDevice = args.some(arg => arg.startsWith('-sDEVICE='));
  const hasOutput = args.some(arg => arg.startsWith('-sOutputFile='));
  
  if (!hasDevice) {
    throw new Error('Missing -sDEVICE parameter in command');
  }
  
  if (!hasOutput) {
    throw new Error('Missing -sOutputFile parameter in command');
  }
  
  return true;
}

let Module: any;

function _GSPS2PDF(
  dataStruct: any,
  responseCallback: (data: any) => void,
) {
  try {
    const { operation, customCommand, pdfSetting, files, advancedSettings, showTerminalOutput, showProgressBar } = dataStruct;
    
    // Handle multiple files for merge operation
    if (operation === 'merge' && files && files.length > 1) {
      return _GSMergePDF(dataStruct, responseCallback);
    }
    
    // Handle split operation
    if (operation === 'split') {
      return _GSSplitPDF(dataStruct, responseCallback);
    }

    
    // Handle single file operations (compress)
    const xhr = new XMLHttpRequest();
    xhr.open("GET", dataStruct.psDataURL);
    xhr.responseType = "arraybuffer";
    xhr.onerror = function () {
      responseCallback({ error: 'Failed to load input file' });
    };
    xhr.onload = function () {
      try {
        console.log('onload');
        
        // Generate args based on operation and settings
        let args: string[] = [];
        
        if (customCommand && customCommand.trim()) {
          // Parse custom command properly
          args = parseCommandArgs(customCommand.trim());
          validateArgs(args);
        } else {
          // Use predefined settings
          args = [
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dNOPAUSE",
            "-dBATCH",
            "-sOutputFile=output.pdf"
          ];
          
          // Add or remove -dQUIET based on terminal output or progress bar settings
          if (!showTerminalOutput && !showProgressBar) {
            args.splice(4, 0, "-dQUIET");
          }
          
          // Add PDF settings based on operation
          if (operation === 'compress' && pdfSetting) {
            args.splice(2, 0, `-dPDFSETTINGS=${pdfSetting}`);
          }
          
          // Apply advanced settings if provided
          if (advancedSettings) {
            args = buildAdvancedArgs(advancedSettings, args);
          }
          
          args.push("input.pdf");
        }
        
        console.log('Ghostscript args:', args);
        
        // set up Emscripten environment
        Module = {
          preRun: [
            function () {
              try {
                (self as any).Module.FS.writeFile("input.pdf", new Uint8Array(xhr.response));
              } catch (e: any) {
                console.error('Error writing input file:', e);
                responseCallback({ error: 'Failed to write input file: ' + e.message });
              }
            },
          ],
          postRun: [
            function () {
              try {
                const uarray = (self as any).Module.FS.readFile("output.pdf", { encoding: "binary" });
                const blob = new Blob([uarray], { type: "application/octet-stream" });
                const pdfDataURL = self.URL.createObjectURL(blob);
                responseCallback({ pdfDataURL: pdfDataURL, url: dataStruct.url });
                
                // Cleanup filesystem
                try {
                  (self as any).Module.FS.unlink("input.pdf");
                  (self as any).Module.FS.unlink("output.pdf");
                } catch (cleanupError) {
                  console.warn('Cleanup warning:', cleanupError);
                }
              } catch (e: any) {
                console.error('Error reading output file:', e);
                responseCallback({ error: 'Failed to generate output file: ' + e.message });
              }
            },
          ],
          arguments: args,
          print: function (text: string) { 
            console.log('GS:', text); 
            // Send terminal output when either terminal output or progress bar is enabled
            if (showTerminalOutput || showProgressBar) {
              self.postMessage({ type: 'progress', data: text });
            }
          },
          printErr: function (text: string) { 
            console.error('GS Error:', text); 
            if (text.includes('Error') || text.includes('Fatal')) {
              responseCallback({ error: 'Ghostscript error: ' + text });
            }
          },
          totalDependencies: 0,
          noExitRuntime: 1
        };
        
        if (!(self as any).Module) {
          (self as any).Module = Module;
          loadScript();
        } else {
          (self as any).Module["calledRun"] = false;
          (self as any).Module["postRun"] = Module.postRun;
          (self as any).Module["preRun"] = Module.preRun;
          (self as any).Module.callMain(args);
        }
      } catch (e: any) {
        console.error('Error in processing:', e);
        responseCallback({ error: 'Processing error: ' + e.message });
      }
    };
    xhr.send();
  } catch (e: any) {
    console.error('Error in _GSPS2PDF:', e);
    responseCallback({ error: 'Initialization error: ' + e.message });
  }
}

/**
 * Handle PDF merging
 */
function _GSMergePDF(dataStruct: any, responseCallback: (data: any) => void) {
  try {
    const { files, customCommand, pdfSetting, advancedSettings, showTerminalOutput, showProgressBar } = dataStruct;
    let filesLoaded = 0;
    const fileData: Uint8Array[] = [];
    let hasError = false;
    
    // Load all files
    files.forEach((fileUrl: string, index: number) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", fileUrl);
      xhr.responseType = "arraybuffer";
      xhr.onerror = function () {
        if (!hasError) {
          hasError = true;
          responseCallback({ error: `Failed to load file ${index + 1}` });
        }
      };
      xhr.onload = function () {
        if (hasError) return;
        
        try {
          fileData[index] = new Uint8Array(xhr.response);
          filesLoaded++;
          
          if (filesLoaded === files.length) {
            // All files loaded, proceed with merge
            let args: string[] = [];
            
            if (customCommand && customCommand.trim()) {
              args = parseCommandArgs(customCommand.trim());
              validateArgs(args);
            } else {
              args = [
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dNOPAUSE",
                "-dBATCH",
                "-sOutputFile=output.pdf"
              ];
              
              // Add or remove -dQUIET based on terminal output or progress bar settings
              if (!showTerminalOutput && !showProgressBar) {
                args.splice(4, 0, "-dQUIET");
              }
              
              if (pdfSetting) {
                args.splice(2, 0, `-dPDFSETTINGS=${pdfSetting}`);
              }
              
              // Apply advanced settings if provided
              if (advancedSettings) {
                const tempArgs = [...args];
                args = buildAdvancedArgs(advancedSettings, tempArgs);
              }
              
              // Add input files
              for (let i = 0; i < files.length; i++) {
                args.push(`input${i}.pdf`);
              }
            }
            
            console.log('Merge args:', args);
            
            Module = {
              preRun: [
                function () {
                  try {
                    // Write all input files
                    fileData.forEach((data, index) => {
                      (self as any).Module.FS.writeFile(`input${index}.pdf`, data);
                    });
                  } catch (e: any) {
                    console.error('Error writing input files:', e);
                    responseCallback({ error: 'Failed to write input files: ' + e.message });
                  }
                },
              ],
              postRun: [
                function () {
                  try {
                    const uarray = (self as any).Module.FS.readFile("output.pdf", { encoding: "binary" });
                    const blob = new Blob([uarray], { type: "application/octet-stream" });
                    const pdfDataURL = self.URL.createObjectURL(blob);
                    responseCallback({ pdfDataURL: pdfDataURL, operation: 'merge' });
                    
                    // Cleanup filesystem
                    try {
                      for (let i = 0; i < files.length; i++) {
                        (self as any).Module.FS.unlink(`input${i}.pdf`);
                      }
                      (self as any).Module.FS.unlink("output.pdf");
                    } catch (cleanupError) {
                      console.warn('Merge cleanup warning:', cleanupError);
                    }
                  } catch (e: any) {
                    console.error('Error reading merge output:', e);
                    responseCallback({ error: 'Failed to generate merged file: ' + e.message });
                  }
                },
              ],
              arguments: args,
              print: function (text: string) { 
                console.log('GS Merge:', text); 
                if (showTerminalOutput || showProgressBar) {
                  self.postMessage({ type: 'progress', data: text });
                }
              },
              printErr: function (text: string) { 
                console.error('GS Merge Error:', text);
                if (text.includes('Error') || text.includes('Fatal')) {
                  responseCallback({ error: 'Ghostscript merge error: ' + text });
                }
              },
              totalDependencies: 0,
              noExitRuntime: 1
            };
            
            if (!(self as any).Module) {
              (self as any).Module = Module;
              loadScript();
            } else {
              (self as any).Module["calledRun"] = false;
              (self as any).Module["postRun"] = Module.postRun;
              (self as any).Module["preRun"] = Module.preRun;
              (self as any).Module.callMain(args);
            }
          }
        } catch (e: any) {
          if (!hasError) {
            hasError = true;
            console.error('Error processing merge file:', e);
            responseCallback({ error: 'Error processing merge file: ' + e.message });
          }
        }
      };
      xhr.send();
    });
  } catch (e: any) {
    console.error('Error in _GSMergePDF:', e);
    responseCallback({ error: 'Merge initialization error: ' + e.message });
  }
}

/**
 * Handle PDF splitting
 */
function _GSSplitPDF(dataStruct: any, responseCallback: (data: any) => void) {
  try {
    const { psDataURL, customCommand, splitRange, advancedSettings, showTerminalOutput, showProgressBar } = dataStruct;
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", psDataURL);
    xhr.responseType = "arraybuffer";
    xhr.onerror = function () {
      responseCallback({ error: 'Failed to load input file for splitting' });
    };
    xhr.onload = function () {
      try {
        console.log('split onload');
        let args: string[] = [];
        
        if (customCommand && customCommand.trim()) {
          args = parseCommandArgs(customCommand.trim());
          validateArgs(args);
        } else {
          args = [
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dNOPAUSE",
            "-dBATCH"
          ];
          
          // Add or remove -dQUIET based on terminal output or progress bar settings
          if (!showTerminalOutput && !showProgressBar) {
            args.splice(3, 0, "-dQUIET");
          }
          
          if (splitRange && splitRange.startPage && splitRange.endPage) {
            const startPage = parseInt(splitRange.startPage);
            const endPage = parseInt(splitRange.endPage);
            
            if (isNaN(startPage) || isNaN(endPage) || startPage < 1 || endPage < startPage) {
              responseCallback({ error: 'Invalid page range specified' });
              return;
            }
            
            args.push(`-dFirstPage=${startPage}`);
            args.push(`-dLastPage=${endPage}`);
          } else {
            responseCallback({ error: 'Page range not specified for split operation' });
            return;
          }
          
          // Apply advanced settings if provided
          if (advancedSettings) {
            const tempArgs = [...args.slice(0, -2)];
            const splitArgs = args.slice(-2);
            const processedArgs = buildAdvancedArgs(advancedSettings, tempArgs);
            args = [...processedArgs, ...splitArgs];
          }
          
          args.push("-sOutputFile=output.pdf");
          args.push("input.pdf");
        }
        
        console.log('Split args:', args);
        
        Module = {
          preRun: [
            function () {
              try {
                (self as any).Module.FS.writeFile("input.pdf", new Uint8Array(xhr.response));
              } catch (e: any) {
                console.error('Error writing split input file:', e);
                responseCallback({ error: 'Failed to write input file for splitting: ' + e.message });
              }
            },
          ],
          postRun: [
            function () {
              try {
                const uarray = (self as any).Module.FS.readFile("output.pdf", { encoding: "binary" });
                const blob = new Blob([uarray], { type: "application/octet-stream" });
                const pdfDataURL = self.URL.createObjectURL(blob);
                responseCallback({ pdfDataURL: pdfDataURL, operation: 'split' });
                
                // Cleanup filesystem
                try {
                  (self as any).Module.FS.unlink("input.pdf");
                  (self as any).Module.FS.unlink("output.pdf");
                } catch (cleanupError) {
                  console.warn('Split cleanup warning:', cleanupError);
                }
              } catch (e: any) {
                console.error('Error reading split output:', e);
                responseCallback({ error: 'Failed to generate split file: ' + e.message });
              }
            },
          ],
          arguments: args,
          print: function (text: string) { 
            console.log('GS Split:', text); 
            if (showTerminalOutput || showProgressBar) {
              self.postMessage({ type: 'progress', data: text });
            }
          },
          printErr: function (text: string) { 
            console.error('GS Split Error:', text);
            if (text.includes('Error') || text.includes('Fatal')) {
              responseCallback({ error: 'Ghostscript split error: ' + text });
            }
          },
          totalDependencies: 0,
          noExitRuntime: 1
        };
        
        if (!(self as any).Module) {
          (self as any).Module = Module;
          loadScript();
        } else {
          (self as any).Module["calledRun"] = false;
          (self as any).Module["postRun"] = Module.postRun;
          (self as any).Module["preRun"] = Module.preRun;
          (self as any).Module.callMain(args);
        }
      } catch (e: any) {
        console.error('Error in split processing:', e);
        responseCallback({ error: 'Split processing error: ' + e.message });
      }
    };
    xhr.send();
  } catch (e: any) {
    console.error('Error in _GSSplitPDF:', e);
    responseCallback({ error: 'Split initialization error: ' + e.message });
  }
}

self.addEventListener('message', function(event: MessageEvent) {
  const e = event.data;
  if (e.target !== 'wasm'){
    return;
  }
  
  try {
    _GSPS2PDF(e.data || e, (result: any) => {
      self.postMessage({ type: 'result', data: result });
    });
  } catch (error: any) {
    console.error('Worker exception:', error);
    self.postMessage({ type: 'result', data: { error: 'Worker exception: ' + error.message } });
  }
});

console.log("Worker ready");
