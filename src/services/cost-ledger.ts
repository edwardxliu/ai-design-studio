import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";

export type CostLedgerRecordInput = {
  taskId: string;
  task: string;
  model: string;
  mode: string;
  country: string;
  language: string;
  estimatedUnits: number;
  isFallback: boolean;
  sourceAssetIds: string[];
};

export type CostLedgerRecord = CostLedgerRecordInput & {
  id: string;
  createdAt: string;
};

export type CostLedger = {
  appendRecord(input: CostLedgerRecordInput): Promise<CostLedgerRecord>;
  readRecords(): Promise<CostLedgerRecord[]>;
};

export type CostLedgerOptions = {
  dataDir: string;
};

export function createCostLedger(options: CostLedgerOptions): CostLedger {
  const dataDir = resolve(options.dataDir);
  const ledgerPath = join(dataDir, "cost-records.json");

  async function readRawRecords(): Promise<CostLedgerRecord[]> {
    try {
      const raw = await readFile(ledgerPath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return {
    async appendRecord(input) {
      await mkdir(dataDir, { recursive: true });
      const record: CostLedgerRecord = {
        id: `cost-${randomUUID()}`,
        createdAt: new Date().toISOString(),
        ...input
      };
      const records = await readRawRecords();
      await writeFile(ledgerPath, `${JSON.stringify([...records, record], null, 2)}\n`, "utf8");
      return record;
    },

    async readRecords() {
      const records = await readRawRecords();
      return records.toSorted((left, right) => right.createdAt.localeCompare(left.createdAt));
    }
  };
}

export function createDefaultCostLedger(): CostLedger {
  return createCostLedger({ dataDir: join(process.cwd(), "data") });
}
