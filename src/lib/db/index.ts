import Dexie, { type EntityTable } from 'dexie';

interface CalculationHistory {
  id: number;
  toolUrl: string;
  toolName: string;
  input: any;
  result: any;
  timestamp: number;
  file?: {
    blob: Blob;
    name: string;
  };
}

const db = new Dexie('RedecDatabase') as Dexie & {
  history: EntityTable<
    CalculationHistory,
    'id'
  >;
};

// Schema declaration:
db.version(1).stores({
  history: '++id, toolUrl, toolName, timestamp' // Primary key and indexed fields
});

export type { CalculationHistory };
export { db };
