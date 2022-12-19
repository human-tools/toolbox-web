import { TrashIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';

interface Props {
  images: string[];
  onPick?: (index: number) => void;
  showDelete?: boolean;
  onDelete?: (index: number) => void;
}

const ImagePickerButton = ({
  images,
  onPick,
  onDelete,
  showDelete = false,
}: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = useCallback(() => {
    setIsOpen((isOpen) => !isOpen);
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      onPick && onPick(index);
      setIsOpen(false);
    },
    [onPick]
  );

  return (
    <div className="border border-gray-100 relative w-48">
      <button onClick={handleClick} className="h-10 w-full text-center">
        Insert Saved Objects
      </button>
      {isOpen && (
        <ul className="absolute z-20 shadow bg-white w-full">
          {images.map((image, index) => (
            <li
              key={image}
              className="p-4 text-center relative cursor-pointer"
              onClick={() => handleSelect(index)}
            >
              <img className="inline" src={image} alt="Image" />
              {showDelete && (
                <button
                  className="text-gray-500 hover:text-red-700 absolute top-8 right-2"
                  onClick={() => onDelete && onDelete(index)}
                >
                  <TrashIcon className="w-5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ImagePickerButton;
