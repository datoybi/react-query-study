import jsonpatch from 'fast-json-patch';
import { UseMutateFunction, useMutation, useQueryClient } from 'react-query';

import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useCustomToast } from '../../app/hooks/useCustomToast';
import { useUser } from './useUser';

// for when we need a server function
async function patchUserOnServer(
  newData: User | null,
  originalData: User | null,
): Promise<User | null> {
  if (!newData || !originalData) return null;
  // create a patch for the difference between newData and originalData
  const patch = jsonpatch.compare(originalData, newData);

  // send patched data to the server
  const { data } = await axiosInstance.patch(
    `/user/${originalData.id}`,
    { patch },
    {
      headers: getJWTHeader(originalData),
    },
  );
  return data.user;
}

export function usePatchUser(): UseMutateFunction<
  User,
  unknown,
  User,
  unknown
> {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();
  const queryClient = useQueryClient();

  const { mutate: patchUser } = useMutation(
    (newUserData: User) => patchUserOnServer(newUserData, user),
    {
      onMutate: async (newData: User | null) => {
        // 진행중인 유저 데이터를 취소한다.
        // 오래된 서버 데이터는 optimistic 업데이트를 덮어쓰지 않는다.
        queryClient.cancelQueries(queryKeys.user);

        // 이전 값의 snapshot을 찍는다.
        const previousUserData: User = queryClient.getQueryData(queryKeys.user);

        // 새로운 값으로 낙관적인 업데이트를 한다.
        updateUser(newData);

        // 그리고 스냅샷된 값의 콘텍스트 객체를 반환한다.
        return { previousUserData };
      },
      onError: (error, newData, context) => {
        // 저장된 값으로 캐시를 롤백한다.
        if (context.previousUserData) {
          updateUser(context.previousUserData);
          toast({
            title: 'update failed; restoring previous values',
            status: 'warning',
          });
        }
      },
      onSuccess: (userData: User | null) => {
        if (user) {
          toast({
            title: 'User updated!',
            status: 'success',
          });
        }
      },
      onSettled: () => {
        // 서버 데이터와 맞다는걸 확신하기위해 유저 쿼리를 무효화한다.
        queryClient.invalidateQueries(queryKeys.user);
      },
    },
  );

  return patchUser;
}
