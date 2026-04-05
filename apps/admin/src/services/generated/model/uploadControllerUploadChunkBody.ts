export type UploadControllerUploadChunkBody = {
  file?: Blob;
  uploadId?: string;
  chunkIndex?: number;
  totalChunks?: number;
};
