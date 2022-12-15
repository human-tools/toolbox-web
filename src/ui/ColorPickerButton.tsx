import { useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';

interface Props {
  onChange: (value: string) => void;
  color: string;
}

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

const ColorPickerButton = ({ onChange, color }: Props): JSX.Element => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
    if (onChange) {
      onChange(color.hex);
    }
  };

  return (
    <div className="relative flex">
      <button onClick={handleClick}>
        <div
          style={{
            background: selectedColor,
            width: 25,
            height: 25,
          }}
        />
      </button>

      {displayColorPicker ? (
        <div className="absolute z-30 top-7">
          <SketchPicker color={selectedColor} onChange={handleChange} />
        </div>
      ) : null}
    </div>
  );
};

export default ColorPickerButton;
