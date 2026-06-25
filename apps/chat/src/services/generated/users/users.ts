import { useMutation } from '@tanstack/react-query';
import { httpMutator } from '../../http';
import type { UserProfileDto } from '../model';

export const usersControllerUpdateProfile = (
  data: { nickname?: string; bio?: string; avatar?: string },
) => {
  return httpMutator<UserProfileDto>({
    url: `/api/users/profile`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
};

export const useUsersControllerUpdateProfile = () => {
  return useMutation({
    mutationFn: usersControllerUpdateProfile,
    mutationKey: ['usersControllerUpdateProfile'],
  });
};
