import { useState } from 'react';
import { ColorResult, RGBColor, SketchPicker } from 'react-color';

interface Props {
  onChange: (color: RGBColor) => void;
  color: RGBColor;
  disableAlpha?: boolean;
}

export const rgbColorToHex = ({ r, g, b }: RGBColor): string => {
  // Make sure each component is an integer in the range [0, 255]
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  // Convert each component to a two-digit hexadecimal string
  const redHex = r.toString(16).padStart(2, '0');
  const greenHex = g.toString(16).padStart(2, '0');
  const blueHex = b.toString(16).padStart(2, '0');

  // Concatenate the hexadecimal strings to form the final hexadecimal string
  return `#${redHex}${greenHex}${blueHex}`;
};

export const hexToRgb = (
  hex: string
): { red: number; green: number; blue: number } => {
  // Parse the hexadecimal string to a number
  const int = parseInt(hex.replace('#', ''), 16);

  // Extract the red, green, and blue values using bitwise operators
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;

  // Divide the values by 255 to convert them to floating-point numbers between 0 and 1
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  // Return the RGB values as an object
  return { red, green, blue };
};

export const DEFAULT_COLOR = { r: 0, g: 0, b: 0, a: 1 };

export const rgbColorToCssRgba = (color: RGBColor): string =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

export const cssRgbaToRgbColor = (rgbaString: string): RGBColor => {
  // Match the rgba string against the regular expression
  const match = rgbaString.match(
    /rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(?:\.\d+)?)\)/
  );

  // Return null if the string does not match the rgba format
  if (!match) return DEFAULT_COLOR;

  // Parse the red, green, blue, and alpha values from the string
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = parseFloat(match[4]);

  // Return an object with the rgba values
  return {
    r,
    g,
    b,
    a,
  };
};

const ColorPickerButton = ({
  onChange,
  color,
  disableAlpha = false,
}: Props): JSX.Element => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleChange = (color: ColorResult) => {
    setSelectedColor(color.rgb);
    if (onChange) {
      onChange(color.rgb);
    }
  };

  return (
    <div className="relative flex">
      <button onClick={handleClick}>
        <div
          style={{
            background: `rgba(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}, ${selectedColor.a})`,
            width: 25,
            height: 25,
          }}
        />
      </button>

      {displayColorPicker ? (
        <div className="absolute z-30 top-7">
          <SketchPicker
            color={selectedColor}
            onChange={handleChange}
            disableAlpha={disableAlpha}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ColorPickerButton;
