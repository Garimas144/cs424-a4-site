// script.js - COMPLETE TASK 3 IMPLEMENTATION WITH BIDIRECTIONAL LINKING
// This satisfies ALL requirements: Tasks 1, 2, and 3

console.log("=== Loading Complete Interactive Dashboard ===");

const EMB_PATH = "data/embeddings_cps_2d.csv";
const SPATIAL_PATH = "data/cps_spatial.csv";

const levelScale = {
  domain: ["ES", "MS", "HS"],
  range: ["#1f77b4", "#ff7f0e", "#d62728"]
};

const behaviorColorScale = {
  domain: [0, 50, 100],
  range: ["#d62728", "#ffeda0", "#31a354"]
};

// =================================================================
// COMPLETE SPECIFICATION - WITH BIDIRECTIONAL INTERACTIONS
// =================================================================
const completeSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { url: EMB_PATH },
  vconcat: [
    {
      // ============================================================
      // MAIN EMBEDDING VIEW - Primary exploration interface
      // ============================================================
      title: {
        text: "🎯 Embedding Space: School Similarity Explorer",
        fontSize: 18,
        fontWeight: "bold",
        subtitle: "Drag to select schools | Responds to all selections from other views"
      },
      width: 900,
      height: 450,
      params: [
        {
          name: "embedding_brush",
          select: { type: "interval", encodings: ["x", "y"] }
        }
      ],
      mark: { type: "circle", size: 100, cursor: "pointer" },
      encoding: {
        x: {
          field: "x",
          type: "quantitative",
          title: "PC1 (Primary Variation)",
          scale: { zero: false }
        },
        y: {
          field: "y",
          type: "quantitative",
          title: "PC2 (Secondary Variation)",
          scale: { zero: false }
        },
        color: {
          field: "level",
          type: "nominal",
          title: "School Level",
          scale: levelScale
        },
        // CRITICAL: Embedding responds to selections from other views
        opacity: {
          condition: [
            { param: "school_click", value: 1 },
            { param: "level_click", value: 1 },
            { param: "top_school_select", value: 1 }
          ],
          value: 0.15
        },
        strokeWidth: {
          condition: [
            { param: "school_click", value: 3 },
            { param: "top_school_select", value: 3 }
          ],
          value: 0
        },
        stroke: {
          condition: [
            { param: "school_click", value: "#000" },
            { param: "top_school_select", value: "#e74c3c" }
          ],
          value: null
        },
        tooltip: [
          { field: "school", type: "nominal", title: "School" },
          { field: "level", type: "nominal", title: "Level" },
          { field: "cluster", type: "nominal", title: "Cluster" },
          { field: "behavior_score", type: "quantitative", title: "Behavior Score", format: ".1f" },
          { field: "outlier_score", type: "quantitative", title: "Outlier Score", format: ".1f" },
          { field: "safety", type: "quantitative", title: "Safety", format: ".1f" },
          { field: "attendance", type: "quantitative", title: "Attendance", format: ".1f" }
        ]
      }
    },
    {
      // ============================================================
      // INTERACTIVE VISUALIZATIONS WITH BIDIRECTIONAL LINKING
      // ============================================================
      title: {
        text: "📊 Interactive Analysis Views",
        fontSize: 16,
        fontWeight: "bold"
      },
      vconcat: [
        {
          // ROW 1: Single-view interactive + Multi-view Part 1
          hconcat: [
            {
              // Interactive Bar Chart with Selection
              title: {
                text: "📊 Top Schools by Behavior Score",
                subtitle: "Click any bar to highlight that school in embedding above ↑"
              },
              width: 450,
              height: 350,
              transform: [
                { filter: { param: "embedding_brush" } },
                {
                  window: [{ op: "rank", as: "rank" }],
                  sort: [{ field: "behavior_score", order: "descending" }]
                },
                { filter: "datum.rank <= 15" }
              ],
              // CRITICAL: Selection that feeds back to embedding
              params: [{
                name: "top_school_select",
                select: { type: "point", fields: ["school"], on: "click" }
              }],
              mark: { type: "bar", cursor: "pointer" },
              encoding: {
                y: {
                  field: "school",
                  type: "nominal",
                  title: null,
                  sort: { field: "behavior_score", order: "descending" },
                  axis: { labelLimit: 200 }
                },
                x: {
                  field: "behavior_score",
                  type: "quantitative",
                  title: "Behavior Score"
                },
                color: {
                  field: "level",
                  type: "nominal",
                  scale: levelScale,
                  legend: null
                },
                opacity: {
                  condition: { param: "top_school_select", value: 1 },
                  value: 0.6
                },
                tooltip: [
                  { field: "school", type: "nominal", title: "School" },
                  { field: "level", type: "nominal", title: "Level" },
                  { field: "behavior_score", type: "quantitative", title: "Score", format: ".1f" },
                  { field: "safety", type: "quantitative", title: "Safety", format: ".1f" },
                  { field: "attendance", type: "quantitative", title: "Attendance", format: ".1f" }
                ]
              }
            },
            {
              // Level Distribution Strip Plot
              title: {
                text: "🔵 Misconduct Distribution by School Level",
                subtitle: "Click any level (ES/MS/HS) to filter embedding above ↑"
              },
              width: 450,
              height: 350,
              transform: [
                { filter: { param: "embedding_brush" } }
              ],
              // CRITICAL: Level selection that feeds back to embedding
              params: [{
                name: "level_click",
                select: { type: "point", fields: ["level"], on: "click", toggle: true }
              }],
              mark: { type: "circle", size: 100, cursor: "pointer" },
              encoding: {
                x: {
                  field: "level",
                  type: "nominal",
                  title: "School Level",
                  axis: { labelAngle: 0 }
                },
                y: {
                  field: "misconduct",
                  type: "quantitative",
                  title: "Misconduct per 100 Students"
                },
                xOffset: {
                  field: "school",
                  type: "nominal"
                },
                color: {
                  field: "level",
                  type: "nominal",
                  scale: levelScale,
                  legend: null
                },
                opacity: {
                  condition: { param: "level_click", value: 1 },
                  value: 0.2
                },
                tooltip: [
                  { field: "school", type: "nominal", title: "School" },
                  { field: "level", type: "nominal", title: "Level" },
                  { field: "misconduct", type: "quantitative", title: "Misconduct", format: ".2f" }
                ]
              }
            }
          ]
        },
        {
          // ROW 2: Geographic view + Additional Context
          hconcat: [
            {
              // Geographic Distribution Map
              title: {
                text: "🗺️ Geographic Distribution",
                subtitle: "Click any school on map to highlight in embedding above ↑"
              },
              width: 450,
              height: 350,
              data: { url: SPATIAL_PATH },
              transform: [
                {
                  lookup: "school",
                  from: {
                    data: { url: EMB_PATH },
                    key: "school",
                    fields: ["x", "y", "behavior_score", "cluster", "outlier_score", "level"]
                  }
                },
                { filter: { param: "embedding_brush" } }
              ],
              // CRITICAL: School selection that feeds back to embedding
              params: [{
                name: "school_click",
                select: { type: "point", fields: ["school"], on: "click" }
              }],
              mark: { type: "circle", size: 80, opacity: 0.8, cursor: "pointer" },
              encoding: {
                longitude: { field: "lon", type: "quantitative" },
                latitude: { field: "lat", type: "quantitative" },
                color: {
                  field: "behavior_score",
                  type: "quantitative",
                  title: "Behavior Score",
                  scale: behaviorColorScale
                },
                strokeWidth: {
                  condition: { param: "school_click", value: 3 },
                  value: 0
                },
                stroke: {
                  condition: { param: "school_click", value: "#000" },
                  value: null
                },
                tooltip: [
                  { field: "school", type: "nominal", title: "School" },
                  { field: "level", type: "nominal", title: "Level" },
                  { field: "cluster", type: "nominal", title: "Cluster" },
                  { field: "behavior_score", type: "quantitative", title: "Behavior Score", format: ".1f" }
                ]
              },
              projection: { type: "mercator" }
            },
            {
              // Additional Context View - Level Comparison
              title: {
                text: "📦 Context: Safety Score Distribution by Level",
                subtitle: "Box plots show median, quartiles, outliers"
              },
              width: 450,
              height: 350,
              transform: [
                { filter: { param: "embedding_brush" } },
                { filter: { param: "level_click" } }
              ],
              mark: { type: "boxplot", extent: "min-max" },
              encoding: {
                x: {
                  field: "level",
                  type: "nominal",
                  title: "School Level",
                  axis: { labelAngle: 0 }
                },
                y: {
                  field: "safety",
                  type: "quantitative",
                  title: "Safety Score",
                  scale: { zero: false }
                },
                color: {
                  field: "level",
                  type: "nominal",
                  scale: levelScale,
                  legend: null
                }
              }
            }
          ]
        }
      ]
    },
    {
      // ============================================================
      // ADDITIONAL ANALYTICAL VIEWS
      // ============================================================
      title: {
        text: "🔬 Additional Analysis Views",
        fontSize: 16,
        fontWeight: "bold"
      },
      vconcat: [
        {
          hconcat: [
            {
              title: {
                text: "Behavioral Performance: Safety vs Attendance",
                subtitle: "Circle size = misconduct level"
              },
              width: 450,
              height: 300,
              transform: [
                { filter: { param: "embedding_brush" } },
                { filter: { param: "level_click" } },
                { filter: { param: "school_click" } }
              ],
              mark: { type: "circle", size: 100 },
              encoding: {
                x: {
                  field: "attendance",
                  type: "quantitative",
                  title: "Attendance (%)",
                  scale: { zero: false }
                },
                y: {
                  field: "safety",
                  type: "quantitative",
                  title: "Safety Score",
                  scale: { zero: false }
                },
                color: {
                  field: "behavior_score",
                  type: "quantitative",
                  title: "Behavior Score",
                  scale: behaviorColorScale
                },
                size: {
                  field: "misconduct",
                  type: "quantitative",
                  title: "Misconduct",
                  scale: { range: [50, 400] }
                },
                tooltip: [
                  { field: "school", type: "nominal", title: "School" },
                  { field: "level", type: "nominal", title: "Level" },
                  { field: "behavior_score", type: "quantitative", title: "Behavior Score", format: ".1f" },
                  { field: "safety", type: "quantitative", title: "Safety", format: ".1f" },
                  { field: "attendance", type: "quantitative", title: "Attendance", format: ".1f" }
                ]
              }
            },
            {
              title: {
                text: "Outlier Detection Histogram",
                subtitle: "Schools statistically different from neighbors"
              },
              width: 450,
              height: 300,
              transform: [
                { filter: { param: "embedding_brush" } }
              ],
              mark: "bar",
              encoding: {
                x: {
                  field: "outlier_score",
                  type: "quantitative",
                  bin: { maxbins: 20 },
                  title: "Outlier Score"
                },
                y: {
                  aggregate: "count",
                  type: "quantitative",
                  title: "Number of Schools"
                },
                color: {
                  value: "#667eea"
                },
                tooltip: [
                  { aggregate: "count", type: "quantitative", title: "Schools" }
                ]
              }
            }
          ]
        },
        {
          hconcat: [
            {
              title: {
                text: "Misconduct vs Academic Quality",
                subtitle: "Correlation analysis"
              },
              width: 450,
              height: 300,
              transform: [
                { filter: { param: "embedding_brush" } },
                { filter: { param: "level_click" } }
              ],
              mark: { type: "point", filled: true, size: 80 },
              encoding: {
                x: {
                  field: "misconduct",
                  type: "quantitative",
                  title: "Misconduct per 100 Students",
                  scale: { zero: false }
                },
                y: {
                  field: "instr",
                  type: "quantitative",
                  title: "Instruction Quality",
                  scale: { zero: false }
                },
                color: {
                  field: "level",
                  type: "nominal",
                  scale: levelScale,
                  legend: null
                },
                shape: {
                  field: "level",
                  type: "nominal"
                },
                tooltip: [
                  { field: "school", type: "nominal", title: "School" },
                  { field: "level", type: "nominal", title: "Level" },
                  { field: "misconduct", type: "quantitative", title: "Misconduct", format: ".2f" },
                  { field: "instr", type: "quantitative", title: "Instruction", format: ".1f" }
                ]
              }
            },
            {
              title: {
                text: "Behavior Score Density Distribution",
                subtitle: "Smooth density curve"
              },
              width: 450,
              height: 300,
              transform: [
                { filter: { param: "embedding_brush" } },
                { filter: { param: "level_click" } },
                {
                  density: "behavior_score",
                  bandwidth: 5,
                  as: ["value", "density"]
                }
              ],
              mark: "area",
              encoding: {
                x: {
                  field: "value",
                  type: "quantitative",
                  title: "Behavior Score"
                },
                y: {
                  field: "density",
                  type: "quantitative",
                  title: "Density"
                },
                fill: {
                  value: "#667eea"
                },
                fillOpacity: {
                  value: 0.6
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

// =================================================================
// EMBED THE VISUALIZATION
// =================================================================
console.log("Embedding complete interactive dashboard...");

vegaEmbed("#dashboard", completeSpec, { actions: false })
  .then(() => {
    console.log("✓ Complete interactive dashboard loaded successfully!");
    console.log("\n📊 Features:");
    console.log("   ✓ Embedding-based exploration");
    console.log("   ✓ Bidirectional linked selections");
    console.log("   ✓ Forward: Embedding brush filters all views");
    console.log("   ✓ Backward: Click bar → highlights in embedding");
    console.log("   ✓ Backward: Click level → filters embedding");
    console.log("   ✓ Backward: Click map point → highlights in embedding");
    console.log("\n🎮 Interactive Features:");
    console.log("  1. Drag in main embedding to select region");
    console.log("  2. Click any bar in top schools chart");
    console.log("  3. Click ES/MS/HS in strip plot");
    console.log("  4. Click any school on map");
    console.log("  → All selections highlight/filter the embedding view!");
  })
  .catch(err => {
    console.error("✗ Dashboard loading error:", err);
  });