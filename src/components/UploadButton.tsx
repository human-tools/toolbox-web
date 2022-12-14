import { ArrowUpCircleIcon } from '@heroicons/react/24/solid';
import React, { ReactElement } from 'react';
import { DropEvent, FileRejection, useDropzone } from 'react-dropzone';

interface Props {
  onDrop: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
  accept?: string;
  fullSized?: boolean;
}

function UploadButton({
  onDrop,
  accept = '',
  fullSized = true,
  children,
}: React.PropsWithChildren<Props>): ReactElement {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className={`${!fullSized ? 'h-full' : 'h-full w-full'}`}>
      <div
        {...getRootProps()}
        className={`flex box-border  ${
          !fullSized
            ? 'flex-row h-full p-5 text-md lg:text-lg lg:flex-col'
            : 'h-full w-full p-10 text-md flex-col lg:text-lg lg:flex-row hover:border-2'
        } items-center justify-center bg-gray-50 border border-dashed text-center text-gray-400  hover:bg-blue-50 hover:text-gray-500 hover:cursor-pointer`}
      >
        <input {...getInputProps()} accept={accept} />
        {children && children}
        {!children && (
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 flex items-center justify-center p-8 rounded-full mb-5">
              <span>
                <ArrowUpCircleIcon className="h-8" />
              </span>
            </div>
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>
                <span className="text-blue-500">Browse</span> or Drag files here
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadButton;
