import { AppShell } from "@/src/components/AppShell";
import {
  aggregateCostRecords,
  readDemoCostRecords,
  type CostAggregateRow
} from "@/src/services/demo-api";

// Live ledger records must appear immediately during the on-stage demo.
export const dynamic = "force-dynamic";

const reductionMechanisms = [
  {
    title: "模板引擎 0 调用",
    detail: "POP 平面稿与 PDP 长图由本地模板引擎确定性渲染,不消耗模型调用;只有写实场景图需要图像模型。"
  },
  {
    title: "预设与规则库",
    detail: "国家/语言层级卖点顺序、品牌限制、角度与风格提示词均为固定预设,重复生成时无需重新写 Prompt。"
  },
  {
    title: "素材复用",
    detail: "白底图、平面稿、卖点图入库后可跨 POP/PDP/本地化任务直接复用,避免重复生成同一基础素材。"

  }
];

export default async function CostsPage() {
  const costRows = (await readDemoCostRecords()).filter(
    (row) => !row.isFallback && !/mock|fallback/i.test(row.mode)
  );
  const summary = aggregateCostRecords(costRows);

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>资源消耗说明 / Resource Traceability</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 860 }}>
        每次生成都会记录任务环节、模型、调用模式、国家、语言、源素材和预计消耗单位;
        支持按任务 / 国家 / 语言 / 模式查看,并可作为后续台账与对账基础。
      </p>

      <section
        aria-label="按维度汇总"
        style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 18 }}
      >
        <AggregateCard title="按任务环节" rows={summary.byTask} />
        <AggregateCard title="按国家版本" rows={summary.byCountry} />
        <AggregateCard title="按语言版本" rows={summary.byLanguage} />
        <AggregateCard title="按调用模式" rows={summary.byMode} />
      </section>

      <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, marginBottom: 18, padding: 18 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>如何减少重复调用</h2>
        <p style={{ color: "#5f6c7b", margin: "0 0 12px" }}>
          消耗水平主要受图像模型调用次数、输出分辨率与重试次数影响;以下机制把重复调用压到最低:
        </p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {reductionMechanisms.map((item) => (
            <article key={item.title} style={{ background: "#f7f8fa", border: "1px solid #e5e8ec", borderRadius: 8, padding: 12 }}>
              <strong style={{ display: "block", marginBottom: 6 }}>{item.title}</strong>
              <span style={{ color: "#5f6c7b" }}>{item.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>调用明细台账</h2>
      <table style={{ background: "#ffffff", borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Task", "Model", "Mode", "Country", "Language", "Units", "Sources", "Time"].map((head) => (
              <th key={head} style={{ border: "1px solid #d9e0e7", padding: 12, textAlign: "left" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costRows.map((row, index) => (
            <tr key={`${row.taskId ?? row.task}-${row.country}-${index}`}>
              <td style={cellStyle}>{row.task}</td>
              <td style={cellStyle}>{row.model}</td>
              <td style={cellStyle}>{row.mode}</td>
              <td style={cellStyle}>{row.country}</td>
              <td style={cellStyle}>{row.language}</td>
              <td style={cellStyle}>{row.estimatedUnits}</td>
              <td style={{ ...cellStyle, color: "#5f6c7b" }}>
                {row.sourceAssetIds?.join(", ") ?? "demo baseline"}
              </td>
              <td style={{ ...cellStyle, color: "#5f6c7b" }}>
                {row.createdAt ? row.createdAt.replace("T", " ").slice(0, 19) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}

function AggregateCard({ title, rows }: { title: string; rows: CostAggregateRow[] }) {
  return (
    <article style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 16 }}>
      <strong style={{ color: "#057ca2", display: "block", fontSize: 13, marginBottom: 10 }}>{title}</strong>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map((row) => (
          <div key={row.key} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "#17202a" }}>{row.key}</span>
            <span style={{ color: "#5f6c7b", whiteSpace: "nowrap" }}>
              {row.records} 次 / {row.units} 单位
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

const cellStyle = { border: "1px solid #d9e0e7", padding: 12 } as const;
