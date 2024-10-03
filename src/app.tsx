import chroma from "chroma-js";
import { useState } from "preact/hooks";
import "./app.scss";

const SHADING = {
  linear: (x: number) => x,
  easeIn: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
  easeOut: (x: number) => Math.sin((x * Math.PI) / 2),
  easeInOut: (x: number) => (1 - Math.cos(x * Math.PI)) / 2,
} as const;

type ShadingFunction = keyof typeof SHADING;

interface Color {
  name: string;
  hex: string;
  targetIndex: number;
  shadingFunction: ShadingFunction;
  whiteMixRatio: number;
  blackMixRatio: number;
}

const DEFAULT_COLORS = [
  {
    name: "gray",
    hex: "#302c2c",
    targetIndex: 7,
    shadingFunction: "easeOut",
    whiteMixRatio: 0.9,
    blackMixRatio: 0.85,
  },
  ...Object.entries({
    yellow: "#ffdc40",
    red: "#e4593e",
    teal: "#18aa96",
    blue: "#45a4f9",
    green: "#79cb3a",
  }).map(([name, hex]) => ({
    name,
    hex,
    targetIndex: 5,
    shadingFunction: "easeInOut",
    whiteMixRatio: 0.9,
    blackMixRatio: 0.85,
  })),
] as const;

export function App() {
  const [palette, setPalette] = useState<Color[]>(DEFAULT_COLORS);

  return (
    <>
      <ColorPickers palette={palette} setPalette={setPalette} />
      <Swatches colors={palette} />
      <CssVariablesOutput colors={palette} />
    </>
  );
}

function ColorPickers({
  palette,
  setPalette,
}: {
  palette: Color[];
  setPalette: (colors: Color[]) => void;
}) {
  return (
    <section className="ColorPickers">
      {palette.map((color, i) => (
        <ColorPicker
          key={`${i}-${color.name}`}
          id={`${i}-${color.name}`}
          name={color.name}
          hex={color.hex}
          setName={(name) => {
            const newPalette = JSON.parse(JSON.stringify(palette));
            newPalette[i] = {
              ...newPalette[i],
              name,
            };
            setPalette(newPalette);
          }}
          setHex={(hex) => {
            const newPalette = JSON.parse(JSON.stringify(palette));
            newPalette[i] = {
              ...newPalette[i],
              hex,
            };
            setPalette(newPalette);
          }}
        />
      ))}
    </section>
  );
}

interface ColorPickerProps {
  id: string;
  name: string;
  hex: string;
  setName: (label: string) => void;
  setHex: (hex: string) => void;
}

function ColorPicker({ id, name, hex, setName, setHex }: ColorPickerProps) {
  const nameInputId = `${id}-name`;
  const hexInputId = `${id}-hex`;

  return (
    <>
      <input
        id={nameInputId}
        value={name}
        onChange={(e) => setName(e.currentTarget.value ?? "")}
      />
      <input
        id={hexInputId}
        type="color"
        value={hex}
        onChange={(e) => setHex(e.currentTarget.value ?? "#000")}
      />
      <label for={hexInputId}>
        <pre>
          <code>{hex}</code>
        </pre>
      </label>
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
  const { hex, targetIndex, shadingFunction, whiteMixRatio, blackMixRatio } =
    color;

  const lightestShade = chroma(hex).mix("#fff", whiteMixRatio, "lab");
  const scale = chroma.scale([lightestShade, hex]).mode("lab");
  const length = targetIndex + 1;
  const indices = [...Array(length).keys()];
  const colors = indices.map((i) => {
    const value = SHADING[shadingFunction](i / length);
    return scale(value);
  });

  const darkestShade = chroma(hex).mix("#000", blackMixRatio, "lab");
  const extendedScale = chroma.scale([hex, darkestShade]).mode("lab");
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
