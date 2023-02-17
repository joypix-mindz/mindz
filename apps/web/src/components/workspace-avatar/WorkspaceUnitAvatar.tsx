import type { WorkspaceUnit } from '@affine/datacenter';
import { useEffect, useState } from 'react';

import { WorkspaceAvatar as Avatar } from './Avatar';

const useAvatar = (workspaceUnit: WorkspaceUnit | null) => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarId =
    workspaceUnit?.avatar || workspaceUnit?.blocksuiteWorkspace?.meta.avatar;
  const blobs = workspaceUnit?.blocksuiteWorkspace?.blobs;
  useEffect(() => {
    if (avatarId && blobs) {
      blobs.then(blobs => {
        blobs?.get(avatarId).then(url => setAvatarUrl(url || ''));
      });
    } else {
      setAvatarUrl('');
    }
  }, [avatarId, blobs]);

  return avatarUrl;
};

export const WorkspaceUnitAvatar = ({
  size = 20,
  name,
  workspaceUnit = null,
  style,
}: {
  size?: number;
  name?: string;
  workspaceUnit?: WorkspaceUnit | null;
  style?: React.CSSProperties;
}) => {
  const avatarUrl = useAvatar(workspaceUnit);
  return (
    <Avatar
      size={size}
      name={name || workspaceUnit?.name || ''}
      avatar={avatarUrl}
      style={style}
    />
  );
};
