import React, { ReactElement } from 'react';
import { DropEvent, FileRejection, useDropzone } from 'react-dropzone';
import dragdrop from '../assets/dragdrop.png';

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
}: Props): ReactElement {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className={`${!fullSized ? 'h-full' : 'h-full w-full'}`}>
      <div
        {...getRootProps()}
        className={`flex box-border  ${
          !fullSized
            ? 'flex-row h-full p-5 text-md lg:text-xl lg:flex-col'
            : 'h-full w-full p-10 text-xl flex-col lg:text-3xl lg:flex-row'
        } items-center justify-center  bg-blue-100 rounded text-center text-blue-900  hover:bg-blue-200 hover:text-white hover:cursor-pointer`}
      >
        <input {...getInputProps()} accept={accept} />
        <img
          src={dragdrop}
          className={`${
            !fullSized
              ? 'w-20 lg:w-auto lg:max-w-sm lg:mb-20'
              : 'max-w-xs lg:max-w-xl mb-10 lg:mb-0 lg:mr-20'
          }`}
        />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
    </div>
  );
}

export default UploadButton;
