import { CoreTypes } from 'projects/ngx-filemanager-core/src/public_api';

function blankUserClaim(): CoreTypes.UserCustomClaims {
  return {
    groups: []
  };
}

function blankPermissionsObj(): CoreTypes.FilePermissionsObject {
  return {
    others: 'read/write',
    readers: [],
    writers: []
  };
}

export const permsFactory = {
  blankPermissionsObj,
  blankUserClaim,
};