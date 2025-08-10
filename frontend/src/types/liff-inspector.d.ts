declare module '@line/liff-inspector' {
  interface LIFFInspectorOptions {
    origin?: string;
  }
  
  export default class LIFFInspectorPlugin {
    constructor(options?: LIFFInspectorOptions);
  }
}
