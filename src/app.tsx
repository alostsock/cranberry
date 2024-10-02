import chroma from "chroma-js";
import { useState } from "preact/hooks";
import "./app.scss";

const DEFAULT_COLORS = {
  neutral: "#302c2c",
  palette: {
    yellow: "#ffdc40",
    blue: "#45a4f9",
    red: "#e4593e",
    green: "#79cb3a",
    teal: "#18aa96",
  },
} as const;

const SHADING = {
  linear: (x: number) => x,
  easeIn: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
  easeOut: (x: number) => Math.sin((x * Math.PI) / 2),
  easeInOut: (x: number) => (1 - Math.cos(x * Math.PI)) / 2,
} as const;

interface Color {
  name: string;
  code: string;
  targetIndex: number;
  shadingFunction: (x: number) => number;
  whiteMixRatio: number;
  blackMixRatio: number;
}

export function App() {
  const [neutral, _setNeutral] = useState<Color>({
    name: "gray",
    code: DEFAULT_COLORS.neutral,
    targetIndex: 7,
    shadingFunction: SHADING.easeOut,
    whiteMixRatio: 0.9,
    blackMixRatio: 0.85,
  });

  const [palette, _setPalette] = useState<Color[]>(
    Object.entries(DEFAULT_COLORS.palette).map(([name, code]) => ({
      name,
      code,
      targetIndex: 5,
      shadingFunction: SHADING.easeInOut,
      whiteMixRatio: 0.9,
      blackMixRatio: 0.85,
    })),
  );

  const colors = [neutral, ...palette];

  return (
    <>
      <Swatches colors={colors} />
      <CssVariablesOutput colors={colors} />
    </>
  );
}

function Swatches({ colors }: { colors: Color[] }) {
  return (
    <section className="Swatches">
      {colors.map((color) => (
        <Shades key={color.name} colors={getShades(color)} />
      ))}
    </section>
  );
}

function getShades(color: Color): chroma.Color[] {
  const { code, targetIndex, shadingFunction, whiteMixRatio, blackMixRatio } =
    color;

  const lightestShade = chroma(code).mix("#fff", whiteMixRatio, "lab");
  const scale = chroma.scale([lightestShade, code]).mode("lab");
  const length = targetIndex + 1;
  const indices = [...Array(length).keys()];
  const colors = indices.map((i) => {
    const value = shadingFunction(i / length);
    return scale(value);
  });

  const darkestShade = chroma(code).mix("#000", blackMixRatio, "lab");
  const extendedScale = chroma.scale([code, darkestShade]).mode("lab");
  const extensionLength = 10 - length;
  const extendedIndices = [...Array(extensionLength).keys()].map((i) => i + 1);
  const extendedColors = extendedIndices.map((i) => {
    const value = SHADING.linear(i / extensionLength);
    return extendedScale(value);
  });

  return [...colors, ...extendedColors];
}

function formatHslStr(color: chroma.Color): string {
  const [h, s, l] = color.hsl();
  return `
hsl(${h.toFixed(2)}
    ${s.toFixed(2)}%
    ${l.toFixed(2)}%)`.trim();
}

function Shades({ colors }: { colors: chroma.Color[] }) {
  return (
    <div className="Shades">
      {colors.map((color, i) => {
        return (
          <button key={i} className="shade" style={{ background: color.css() }}>
            <pre>{formatHslStr(color)}</pre>
          </button>
        );
      })}
    </div>
  );
}

function CssVariablesOutput({ colors }: { colors: Color[] }) {
  const inner = colors
    .flatMap((color) => {
      const shades = getShades(color);
      return shades.map(
        (shade, i) => `  --${color.name}-${i}: ${shade.css("hsl")};`,
      );
    })
    .join("\n");

  const outer = `:root {\n${inner}\n}`;

  return (
    <section className="CssVariablesOutput">
      <pre>
        <code>{outer}</code>
      </pre>
    </section>
  );
}
