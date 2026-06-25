import { useMutation } from '@tanstack/react-query';
import { httpMutator } from '../../http';

export const uploadControllerUploadImage = (
  data: FormData,
) => {
  return httpMutator<{ url: string; filename: string }>({
    url: `/api/upload/image`,
    method: 'POST',
    data,
  });
};

export const useUploadControllerUploadImage = () => {
  return useMutation({
    mutationFn: uploadControllerUploadImage,
    mutationKey: ['uploadControllerUploadImage'],
  });
};
