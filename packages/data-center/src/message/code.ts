export enum MessageCode {
  loginError,
  noPermission,
  loadListFailed,
  getDetailFailed,
  createWorkspaceFailed,
  getMembersFailed,
  updateWorkspaceFailed,
  deleteWorkspaceFailed,
  inviteMemberFailed,
  removeMemberFailed,
  acceptInvitingFailed,
  getBlobFailed,
  leaveWorkspaceFailed,
  downloadWorkspaceFailed,
  refreshTokenError,
}

export const messages = {
  [MessageCode.loginError]: {
    message: 'Login failed',
  },
  [MessageCode.noPermission]: {
    message: 'No permission',
  },
  [MessageCode.loadListFailed]: {
    message: 'Load list failed',
  },
  [MessageCode.getDetailFailed]: {
    message: 'Get detail failed',
  },
  [MessageCode.createWorkspaceFailed]: {
    message: 'Create workspace failed',
  },
  [MessageCode.getMembersFailed]: {
    message: 'Get members failed',
  },
  [MessageCode.updateWorkspaceFailed]: {
    message: 'Update workspace failed',
  },
  [MessageCode.deleteWorkspaceFailed]: {
    message: 'Delete workspace failed',
  },
  [MessageCode.inviteMemberFailed]: {
    message: 'Invite member failed',
  },
  [MessageCode.removeMemberFailed]: {
    message: 'Remove member failed',
  },
  [MessageCode.acceptInvitingFailed]: {
    message: 'Accept inviting failed',
  },
  [MessageCode.getBlobFailed]: {
    message: 'Get blob failed',
  },
  [MessageCode.leaveWorkspaceFailed]: {
    message: 'Leave workspace failed',
  },
  [MessageCode.downloadWorkspaceFailed]: {
    message: 'Download workspace failed',
  },
  [MessageCode.refreshTokenError]: {
    message: 'Refresh token failed',
  },
} as const;
