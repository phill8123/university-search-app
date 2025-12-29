// Reference to vite/client commented out to fix "Cannot find type definition" error.
// Ensure you have 'vite' and '@types/node' installed if you need full Vite types.
// /// <reference types="vite/client" />

// Extend the global NodeJS ProcessEnv interface to include API_KEY.
// This avoids the "Cannot redeclare block-scoped variable 'process'" error
// which occurs when 'process' is declared as a const/var while @types/node is present.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
