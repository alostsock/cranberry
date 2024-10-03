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

const DEFAULT_COLORS: Color[] = [
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
    shadingFunction: "easeInOut" as ShadingFunction,
    whiteMixRatio: 0.9,
    blackMixRatio: 0.85,
  })),
] as const;

export function App() {
  const [palette, setPalette] = useState<Color[]>([...DEFAULT_COLORS]);

  return (
    <>
      <ColorPickers palette={palette} setPalette={setPalette} />
      <Swatches colors={palette} />
      <CssVariablesOutput colors={palette} />
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = () => navigator.clipboard.writeText(text);
  return (
    <button class="CopyButton" onClick={handleCopy}>
      📋
    </button>
  );
}

function ColorPickers({
  palette,
  setPalette,
}: {
  palette: Color[];
  setPalette: (colors: Color[]) => void;
}) {
  const updateAttrForIndex = (
    index: number,
    attr: keyof Color,
    value: Color[keyof Color],
  ) => {
    const newPalette = JSON.parse(JSON.stringify(palette));
    newPalette[index] = {
      ...newPalette[index],
      [attr]: value,
    };
    setPalette(newPalette);
  };

  return (
    <section className="ColorPickers">
      {palette.map((color, i) => (
        <ColorPicker
          key={`${i}-${color.name}`}
          id={`${i}-${color.name}`}
          {...color}
          setName={(name) => updateAttrForIndex(i, "name", name)}
          setHex={(hex) => updateAttrForIndex(i, "hex", hex)}
          setShadingFunction={(f) =>
            updateAttrForIndex(i, "shadingFunction", f)
          }
          setWhiteMixRatio={(r) => updateAttrForIndex(i, "whiteMixRatio", r)}
          setBlackMixRatio={(r) => updateAttrForIndex(i, "blackMixRatio", r)}
        />
      ))}
    </section>
  );
}

interface ColorPickerProps {
  id: string;
  name: string;
  hex: string;
  shadingFunction: ShadingFunction;
  whiteMixRatio: number;
  blackMixRatio: number;
  setName: (label: string) => void;
  setHex: (hex: string) => void;
  setShadingFunction: (shadingFunction: ShadingFunction) => void;
  setWhiteMixRatio: (whiteMixRatio: number) => void;
  setBlackMixRatio: (blackMixRatio: number) => void;
}

function ColorPicker({
  id,
  name,
  hex,
  shadingFunction,
  whiteMixRatio,
  blackMixRatio,
  setName,
  setHex,
  setShadingFunction,
  setWhiteMixRatio,
  setBlackMixRatio,
}: ColorPickerProps) {
  const nameInputId = `${id}-name`;
  const hexInputId = `${id}-hex`;
  const shadingFunctionSelectId = `${id}-shading-function`;
  const whiteMixRatioInputId = `${id}-white-mix-ratio`;
  const blackMixRatioInputId = `${id}-black-mix-ratio`;

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
      <CopyButton text={hex} />

      <label for={shadingFunctionSelectId}>Shading function</label>
      <select
        id={shadingFunctionSelectId}
        value={shadingFunction}
        onChange={(e) =>
          setShadingFunction(
            (e.currentTarget.value as ShadingFunction) ?? "linear",
          )
        }
      >
        {Object.keys(SHADING).map((functionName) => (
          <option key={functionName} value={functionName}>
            {functionName}
          </option>
        ))}
      </select>

      <label for={whiteMixRatioInputId}>Max brightness</label>
      <input
        id={whiteMixRatioInputId}
        type="number"
        value={whiteMixRatio}
        onChange={(e) => setWhiteMixRatio(Number(e.currentTarget.value) || 0.9)}
      />

      <label for={blackMixRatioInputId}>Max darkness</label>
      <input
        id={blackMixRatioInputId}
        type="number"
        value={blackMixRatio}
        onChange={(e) => setBlackMixRatio(Number(e.currentTarget.value) || 0.9)}
      />
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
  const brightest = colors[0];
  const darkest = colors[colors.length - 1];

  return (
    <div className="Shades">
      {colors.map((color, i) => {
        const fontColor =
          chroma.contrast(brightest, color) >= chroma.contrast(darkest, color)
            ? brightest
            : darkest;

        return (
          <div key={i} className="shade" style={{ background: color.css() }}>
            <pre style={{ color: fontColor.css() }}>{formatHslStr(color)}</pre>
          </div>
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
