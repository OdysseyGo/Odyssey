import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import {
  getPictureCompareConfig,
  simulatePictureCompare,
  updatePictureCompareConfig,
} from "@/api/endpoints";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type TuningValues = {
  threshold: number;
  fastRejectThreshold: number;
  baseWeight: number;
  edgeWeight: number;
  histogramWeight: number;
  gridWeight: number;
  histogramPenaltyThreshold: number;
  gridPenaltyThreshold: number;
  histogramPenaltyMultiplier: number;
  gridPenaltyMultiplier: number;
  fastMaxShift: number;
  fastStep: number;
  finalMaxShift: number;
  finalStep: number;
  edgeMaxShift: number;
  edgeStep: number;
};

type TuningResult = {
  accepted: boolean;
  similarity_score: number;
  processing_ms: number;
  threshold: number;
  breakdown?: Record<string, number | boolean | Record<string, number>>;
};

const DEFAULT_VALUES: TuningValues = {
  threshold: 0.7,
  fastRejectThreshold: 0.35,
  baseWeight: 0.45,
  edgeWeight: 0.25,
  histogramWeight: 0.15,
  gridWeight: 0.15,
  histogramPenaltyThreshold: 0.78,
  gridPenaltyThreshold: 0.72,
  histogramPenaltyMultiplier: 0.82,
  gridPenaltyMultiplier: 0.82,
  fastMaxShift: 8,
  fastStep: 2,
  finalMaxShift: 12,
  finalStep: 2,
  edgeMaxShift: 12,
  edgeStep: 2,
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

function useFilePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function SliderControl({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format = percent,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="w-16 text-right text-sm text-muted-foreground">
          {format(value)}
        </span>
      </div>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 cursor-pointer p-0"
      />
    </label>
  );
}

function ImageUpload({
  label,
  file,
  preview,
  onChange,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="grid gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="h-72 w-full object-contain"
          />
        ) : (
          <div className="grid justify-items-center gap-3 px-6 text-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
            <span className="text-sm">Upload image</span>
          </div>
        )}
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <span className="truncate text-xs text-muted-foreground">{file.name}</span>
      ) : null}
    </label>
  );
}

export default function PictureCompareTuning() {
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [attemptImage, setAttemptImage] = useState<File | null>(null);
  const [values, setValues] = useState<TuningValues>(DEFAULT_VALUES);
  const [result, setResult] = useState<TuningResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const referencePreview = useFilePreview(referenceImage);
  const attemptPreview = useFilePreview(attemptImage);
  const breakdown = result?.breakdown ?? {};
  const scoreRows: Array<[string, unknown]> = [
    ["Fast similarity", breakdown.fast_similarity],
    ["Base similarity", breakdown.base_similarity],
    ["Edge similarity", breakdown.edge_similarity],
    ["Histogram similarity", breakdown.histogram_similarity],
    ["Grid similarity", breakdown.grid_similarity],
    ["Unpenalized score", breakdown.unpenalized_similarity],
  ];

  const weightTotal = useMemo(
    () =>
      values.baseWeight +
      values.edgeWeight +
      values.histogramWeight +
      values.gridWeight,
    [values],
  );

  const setValue = (key: keyof TuningValues, value: number) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const toApiPayload = (current: TuningValues) => ({
    similarity_threshold: current.threshold,
    fast_reject_threshold: current.fastRejectThreshold,
    base_weight: current.baseWeight,
    edge_weight: current.edgeWeight,
    histogram_weight: current.histogramWeight,
    grid_weight: current.gridWeight,
    histogram_penalty_threshold: current.histogramPenaltyThreshold,
    grid_penalty_threshold: current.gridPenaltyThreshold,
    histogram_penalty_multiplier: current.histogramPenaltyMultiplier,
    grid_penalty_multiplier: current.gridPenaltyMultiplier,
    fast_max_shift: current.fastMaxShift,
    fast_step: current.fastStep,
    final_max_shift: current.finalMaxShift,
    final_step: current.finalStep,
    edge_max_shift: current.edgeMaxShift,
    edge_step: current.edgeStep,
  });

  const fromApiPayload = (data: Record<string, number>): TuningValues => ({
    threshold: data.similarity_threshold ?? DEFAULT_VALUES.threshold,
    fastRejectThreshold:
      data.fast_reject_threshold ?? DEFAULT_VALUES.fastRejectThreshold,
    baseWeight: data.base_weight ?? DEFAULT_VALUES.baseWeight,
    edgeWeight: data.edge_weight ?? DEFAULT_VALUES.edgeWeight,
    histogramWeight: data.histogram_weight ?? DEFAULT_VALUES.histogramWeight,
    gridWeight: data.grid_weight ?? DEFAULT_VALUES.gridWeight,
    histogramPenaltyThreshold:
      data.histogram_penalty_threshold ??
      DEFAULT_VALUES.histogramPenaltyThreshold,
    gridPenaltyThreshold:
      data.grid_penalty_threshold ?? DEFAULT_VALUES.gridPenaltyThreshold,
    histogramPenaltyMultiplier:
      data.histogram_penalty_multiplier ??
      DEFAULT_VALUES.histogramPenaltyMultiplier,
    gridPenaltyMultiplier:
      data.grid_penalty_multiplier ?? DEFAULT_VALUES.gridPenaltyMultiplier,
    fastMaxShift: data.fast_max_shift ?? DEFAULT_VALUES.fastMaxShift,
    fastStep: data.fast_step ?? DEFAULT_VALUES.fastStep,
    finalMaxShift: data.final_max_shift ?? DEFAULT_VALUES.finalMaxShift,
    finalStep: data.final_step ?? DEFAULT_VALUES.finalStep,
    edgeMaxShift: data.edge_max_shift ?? DEFAULT_VALUES.edgeMaxShift,
    edgeStep: data.edge_step ?? DEFAULT_VALUES.edgeStep,
  });

  useEffect(() => {
    getPictureCompareConfig()
      .then((response) => {
        setValues(fromApiPayload(response.data));
      })
      .catch(() => {
        setError("Could not load live picture compare config.");
      });
  }, []);

  const resetDefaults = () => {
    setValues(DEFAULT_VALUES);
    setResult(null);
    setError("");
    setSuccess("");
  };

  const runSimulation = async () => {
    if (!referenceImage || !attemptImage) {
      setError("Upload both a reference image and an attempt image.");
      return;
    }

    const formData = new FormData();
    formData.append("reference_image", referenceImage);
    formData.append("attempt_image", attemptImage);
    formData.append("threshold", String(values.threshold));
    formData.append("fast_reject_threshold", String(values.fastRejectThreshold));
    formData.append("base_weight", String(values.baseWeight));
    formData.append("edge_weight", String(values.edgeWeight));
    formData.append("histogram_weight", String(values.histogramWeight));
    formData.append("grid_weight", String(values.gridWeight));
    formData.append(
      "histogram_penalty_threshold",
      String(values.histogramPenaltyThreshold),
    );
    formData.append("grid_penalty_threshold", String(values.gridPenaltyThreshold));
    formData.append(
      "histogram_penalty_multiplier",
      String(values.histogramPenaltyMultiplier),
    );
    formData.append(
      "grid_penalty_multiplier",
      String(values.gridPenaltyMultiplier),
    );
    formData.append("fast_max_shift", String(values.fastMaxShift));
    formData.append("fast_step", String(values.fastStep));
    formData.append("final_max_shift", String(values.finalMaxShift));
    formData.append("final_step", String(values.finalStep));
    formData.append("edge_max_shift", String(values.edgeMaxShift));
    formData.append("edge_step", String(values.edgeStep));

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      const response = await simulatePictureCompare(formData);
      setResult(response.data);
    } catch {
      setError("Simulation failed. Check the image files and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLiveConfig = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      const response = await updatePictureCompareConfig(toApiPayload(values));
      setValues(fromApiPayload(response.data));
      setSuccess("Live picture compare config updated.");
    } catch {
      setError("Could not update live picture compare config.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Picture Compare Tuning</h1>
          <p className="text-muted-foreground">
            Simulate reference matching with adjustable scoring parameters.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetDefaults}>
            <RotateCcw className="h-4 w-4" />
            Defaults
          </Button>
          <Button variant="secondary" onClick={updateLiveConfig} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Updating..." : "Update Config"}
          </Button>
          <Button onClick={runSimulation} disabled={isSubmitting}>
            <SlidersHorizontal className="h-4 w-4" />
            {isSubmitting ? "Running..." : "Run Simulation"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <ImageUpload
                label="Reference Picture"
                file={referenceImage}
                preview={referencePreview}
                onChange={setReferenceImage}
              />
            </Card>
            <Card>
              <ImageUpload
                label="Picture To Check"
                file={attemptImage}
                preview={attemptPreview}
                onChange={setAttemptImage}
              />
            </Card>
          </div>

          <Card className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Scoring Controls</h2>
              <p className="text-sm text-muted-foreground">
                Weights are normalized automatically. Current total:{" "}
                {weightTotal.toFixed(2)}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SliderControl
                label="Accept Threshold"
                value={values.threshold}
                onChange={(value) => setValue("threshold", value)}
              />
              <SliderControl
                label="Fast Reject Threshold"
                value={values.fastRejectThreshold}
                onChange={(value) => setValue("fastRejectThreshold", value)}
              />
              <SliderControl
                label="Base Difference Weight"
                value={values.baseWeight}
                onChange={(value) => setValue("baseWeight", value)}
              />
              <SliderControl
                label="Edge Weight"
                value={values.edgeWeight}
                onChange={(value) => setValue("edgeWeight", value)}
              />
              <SliderControl
                label="Histogram Weight"
                value={values.histogramWeight}
                onChange={(value) => setValue("histogramWeight", value)}
              />
              <SliderControl
                label="Grid Structure Weight"
                value={values.gridWeight}
                onChange={(value) => setValue("gridWeight", value)}
              />
              <SliderControl
                label="Histogram Penalty Gate"
                value={values.histogramPenaltyThreshold}
                onChange={(value) =>
                  setValue("histogramPenaltyThreshold", value)
                }
              />
              <SliderControl
                label="Grid Penalty Gate"
                value={values.gridPenaltyThreshold}
                onChange={(value) => setValue("gridPenaltyThreshold", value)}
              />
              <SliderControl
                label="Histogram Penalty Multiplier"
                value={values.histogramPenaltyMultiplier}
                onChange={(value) =>
                  setValue("histogramPenaltyMultiplier", value)
                }
              />
              <SliderControl
                label="Grid Penalty Multiplier"
                value={values.gridPenaltyMultiplier}
                onChange={(value) => setValue("gridPenaltyMultiplier", value)}
              />
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Alignment Search</h2>
              <p className="text-sm text-muted-foreground">
                Higher max shift checks more camera framing drift and costs more
                processing time.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <SliderControl
                label="Fast Max Shift"
                value={values.fastMaxShift}
                min={1}
                max={32}
                step={1}
                format={(value) => `${value}px`}
                onChange={(value) => setValue("fastMaxShift", value)}
              />
              <SliderControl
                label="Final Max Shift"
                value={values.finalMaxShift}
                min={1}
                max={48}
                step={1}
                format={(value) => `${value}px`}
                onChange={(value) => setValue("finalMaxShift", value)}
              />
              <SliderControl
                label="Edge Max Shift"
                value={values.edgeMaxShift}
                min={1}
                max={48}
                step={1}
                format={(value) => `${value}px`}
                onChange={(value) => setValue("edgeMaxShift", value)}
              />
              <SliderControl
                label="Fast Step"
                value={values.fastStep}
                min={1}
                max={8}
                step={1}
                format={(value) => `${value}px`}
                onChange={(value) => setValue("fastStep", value)}
              />
              <SliderControl
                label="Final Step"
                value={values.finalStep}
                min={1}
                max={8}
                step={1}
                format={(value) => `${value}px`}
                onChange={(value) => setValue("finalStep", value)}
              />
              <SliderControl
                label="Edge Step"
                value={values.edgeStep}
                min={1}
                max={8}
                step={1}
                format={(value) => `${value}px`}
                onChange={(value) => setValue("edgeStep", value)}
              />
            </div>
          </Card>
        </div>

        <Card className="h-fit space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Simulation Result</h2>
            <p className="text-sm text-muted-foreground">
              Results use the same backend image preparation path as gameplay.
            </p>
          </div>

          {result ? (
            <>
              <div
                className={cn(
                  "rounded-lg border p-4",
                  result.accepted
                    ? "border-success/30 bg-success/10"
                    : "border-warning/30 bg-warning/10",
                )}
              >
                <div className="text-sm font-medium text-muted-foreground">
                  Similarity
                </div>
                <div className="mt-1 text-4xl font-bold">
                  {percent(result.similarity_score)}
                </div>
                <div className="mt-2 text-sm">
                  {result.accepted ? "Accepted" : "Rejected"} at{" "}
                  {percent(result.threshold)} threshold
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Processed in {result.processing_ms}ms
                </div>
              </div>

              <div className="space-y-3">
                {scoreRows.map(([label, value]) =>
                  typeof value === "number" ? (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="text-muted-foreground">
                          {percent(value)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: percent(value) }}
                        />
                      </div>
                    </div>
                  ) : null,
                )}
              </div>

              <div className="rounded-md bg-muted p-4 text-sm">
                <div>
                  Fast reject:{" "}
                  <strong>
                    {breakdown.fast_rejected ? "applied" : "not applied"}
                  </strong>
                </div>
                <div>
                  Histogram penalty:{" "}
                  <strong>
                    {breakdown.histogram_penalty_applied
                      ? "applied"
                      : "not applied"}
                  </strong>
                </div>
                <div>
                  Grid penalty:{" "}
                  <strong>
                    {breakdown.grid_penalty_applied ? "applied" : "not applied"}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Upload two images and run a simulation.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
