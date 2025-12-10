// script.js - FIXED WITH PROPER DATA FILTERING
console.log("=== Loading Dashboard with Filtered Data ===");

const EMB_PATH = "data/embeddings_cps_2d_enhanced.csv";
const SPATIAL_PATH = "data/cps_spatial_enhanced.csv";

const levelScale = {
  domain: ["ES", "MS", "HS"],
  range: ["#1f77b4", "#ff7f0e", "#d62728"]
};

const behaviorColorScale = {
  domain: [0, 50, 100],
  range: ["#d62728", "#ffeda0", "#31a354"]
};

// =================================================================
// WORKING SPECIFICATION WITH PROPER FILTERING
// =================================================================
const completeSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { url: EMB_PATH },
  vconcat: [
    {
      // ============================================================
      // MAIN EMBEDDING VIEW
      // ============================================================
      title: {
        text: "🎯 Embedding Space: School Similarity Explorer",
        fontSize: 18,
        fontWeight: "bold",
        subtitle: "Drag to select schools - filters views below"
      },
      width: 900,
      height: 450,
      params: [
        {
          name: "embedding_brush",
          select: { type: "interval", encodings: ["x", "y"] }
        },
        {
          name: "school_select",
          select: { type: "point", fields: ["school"] }
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
        opacity: {
          condition: { param: "school_select", value: 1 },
          value: 0.6
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
      // INTERACTIVE VISUALIZATIONS
      // ============================================================
      title: {
        text: "📊 Interactive Analysis Views",
        fontSize: 16,
        fontWeight: "bold"
      },
      hconcat: [
        {
          // Interactive Bar Chart
          title: {
            text: "📊 Top Schools by Behavior Score",
            subtitle: "Responds to embedding selection above"
          },
          width: 440,
          height: 400,
          data: { url: EMB_PATH },
          transform: [
            { filter: { param: "embedding_brush" } },
            {
              window: [{ op: "rank", as: "rank" }],
              sort: [{ field: "behavior_score", order: "descending" }]
            },
            { filter: "datum.rank <= 15" }
          ],
          params: [{
            name: "bar_select",
            select: { type: "point", fields: ["school"] }
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
              condition: { param: "bar_select", value: 1 },
              value: 0.6
            },
            tooltip: [
              { field: "school", type: "nominal", title: "School" },
              { field: "level", type: "nominal", title: "Level" },
              { field: "behavior_score", type: "quantitative", title: "Score", format: ".1f" }
            ]
          }
        },
        {
          // Level Distribution
          title: {
            text: "🔵 Misconduct by School Level",
            subtitle: "Responds to embedding selection above"
          },
          width: 440,
          height: 400,
          data: { url: EMB_PATH },
          transform: [
            { filter: { param: "embedding_brush" } }
          ],
          params: [{
            name: "level_select",
            select: { type: "point", fields: ["level"] }
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
              condition: { param: "level_select", value: 1 },
              value: 0.3
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
      hconcat: [
        {
          // Geographic Map - FIXED WITH LOOKUP
          title: {
            text: "🗺️ Geographic Distribution",
            subtitle: "Only shows schools in embedding | Responds to selection above"
          },
          width: 440,
          height: 400,
          data: { url: SPATIAL_PATH },
          transform: [
            // CRITICAL FIX: Join with embedding data to filter to only schools that exist
            {
              lookup: "school",
              from: {
                data: { url: EMB_PATH },
                key: "school",
                fields: ["x", "y", "cluster"]
              }
            },
            // Filter out schools not in embedding (lookup returns null)
            { filter: "datum.x != null" },
            // Apply embedding brush filter
            { filter: { param: "embedding_brush" } }
          ],
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
            tooltip: [
              { field: "school", type: "nominal", title: "School" },
              { field: "level", type: "nominal", title: "Level" },
              { field: "behavior_score", type: "quantitative", title: "Behavior Score", format: ".1f" },
              { field: "safety", type: "quantitative", title: "Safety", format: ".1f" }
            ]
          },
          projection: { type: "mercator" }
        },
        {
          // Box Plot
          title: {
            text: "📦 Safety Distribution by Level",
            subtitle: "Responds to embedding selection above"
          },
          width: 440,
          height: 400,
          data: { url: EMB_PATH },
          transform: [
            { filter: { param: "embedding_brush" } },
            { filter: { param: "level_select" } }
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
    },
    {
      hconcat: [
        {
          title: {
            text: "Safety vs Attendance",
            subtitle: "Circle size = misconduct level"
          },
          width: 440,
          height: 350,
          data: { url: EMB_PATH },
          transform: [
            { filter: { param: "embedding_brush" } },
            { filter: { param: "level_select" } }
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
              { field: "behavior_score", type: "quantitative", title: "Behavior Score", format: ".1f" },
              { field: "safety", type: "quantitative", title: "Safety", format: ".1f" },
              { field: "attendance", type: "quantitative", title: "Attendance", format: ".1f" }
            ]
          }
        },
        {
          title: {
            text: "Outlier Detection Histogram"
          },
          width: 440,
          height: 350,
          data: { url: EMB_PATH },
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
            }
          }
        }
      ]
    }
  ]
};

// =================================================================
// EMBED THE VISUALIZATION
// =================================================================
console.log("Embedding dashboard...");

vegaEmbed("#dashboard", completeSpec, { actions: false })
  .then(() => {
    console.log("✓ Dashboard loaded successfully!");
    console.log("\n🎮 Interaction:");
    console.log("  • Drag in embedding space to select schools");
    console.log("  • Click on levels in the strip plot");
    console.log("  • All views respond to selections");
    console.log("\n⚠️ Note: Map only shows " + 230 + " schools (those in embedding)");
  })
  .catch(err => {
    console.error("✗ Dashboard error:", err);
  });