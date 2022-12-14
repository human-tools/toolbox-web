import { GridLoader } from 'react-spinners';

interface ImagePreviewProps {
  image?: ImageData;
}

export const ImagePreview = ({ image }: ImagePreviewProps): JSX.Element => {
  return (
    <div className="flex justify-center">
      <div className="shadow-sm m-0.5">
        {image ? (
          <img
            src={image.url}
            className="h-40 inline-block pointer-events-none"
          />
        ) : (
          <div className="h-40 w-32 flex justify-center items-center">
            <div className="w-9 transform scale-75">
              <GridLoader
                color={'#BFDBFE'}
                loading={true}
                size={8}
                margin="5px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface ImageData {
  url: string;
  width: number;
  height: number;
}
