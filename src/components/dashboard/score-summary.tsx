import React from "react";
import { Gauge, ShieldAlert, Award } from "lucide-react";

interface ScoreSummaryProps {
  performance: number;
  accessibility: number;
  seo: number;
  security: number;
  brokenLinks: number;
  scannedCount: number;
}

export function ScoreSummary({
  performance,
  accessibility,
  seo,
  security,
  brokenLinks,
  scannedCount,
}: ScoreSummaryProps) {
  const categories = [
    { name: "Performance", score: performance, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { name: "Accessibility", score: accessibility, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { name: "SEO", score: seo, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { name: "Security", score: security, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    { name: "Broken Links", score: brokenLinks, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  ];

  // Calculate average overall network score
  const hasScores = scannedCount > 0;
  const overallAverage = hasScores
    ? Math.round((performance + accessibility + seo + security + brokenLinks) / 5)
    : null;

  const getScoreColorClass = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 90) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-destructive";
  };

  const getStrokeDashArray = (score: number) => {
    // 2 * PI * R where R=36 is ~226
    const circumference = 226.19;
    const offset = circumference - (score / 100) * circumference;
    return `${circumference - offset} ${offset}`;
  };

  return (
    <div className="bg-card border border-border/30 rounded-3xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      
      {/* Left panel: Radial Gauge */}
      <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-border/20 pb-6 lg:pb-0 lg:pr-8">
        <h4 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Average Network Score
        </h4>

        {hasScores ? (
          <div className="space-y-4">
            {/* SVG Circular Progress */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  className="stroke-secondary fill-transparent"
                  strokeWidth="8"
                />
                {/* Foreground Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  className={`fill-transparent transition-all duration-1000 ${
                    overallAverage! >= 90 ? "stroke-emerald-500" : overallAverage! >= 50 ? "stroke-amber-500" : "stroke-destructive"
                  }`}
                  strokeWidth="8"
                  strokeDasharray={getStrokeDashArray(overallAverage!)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-foreground leading-none">
                  {overallAverage}
                </span>
                <span className="block text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                  / 100
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[160px] mx-auto">
              Average score across all connected domains.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-28 space-y-2">
            <Gauge className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
            <p className="text-xs text-muted-foreground">Scan sites to see averages.</p>
          </div>
        )}
      </div>

      {/* Right panel: Category Progress list */}
      <div className="lg:col-span-8 flex flex-col justify-center space-y-5">
        <h4 className="text-sm font-bold text-foreground">Score Breakdown By Category</h4>

        <div className="space-y-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">{cat.name}</span>
                <span className={`font-bold ${getScoreColorClass(hasScores ? cat.score : null)}`}>
                  {hasScores ? `${cat.score}/100` : "—"}
                </span>
              </div>

              {/* Progress Slider track */}
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
                <div
                  style={{ width: hasScores ? `${cat.score}%` : "0%" }}
                  className={`h-full rounded-full transition-all duration-1000 ${
                    hasScores
                      ? cat.score >= 90
                        ? "bg-emerald-500"
                        : cat.score >= 50
                        ? "bg-amber-500"
                        : "bg-destructive"
                      : "bg-muted"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
