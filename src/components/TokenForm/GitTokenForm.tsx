import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { TextField, Button } from '@material-ui/core';

import { SupportedStorageServices } from '@services/types';
import { useUserInfoObservable } from '@services/auth/hooks';
import { useAuth } from './gitTokenHooks';
import { getServiceBranchTypes, getServiceEmailTypes, getServiceTokenTypes, getServiceUserNameTypes } from '@services/auth/interface';

const AuthingLoginButton = styled(Button)`
  width: 100%;
`;
const GitTokenInput = styled(TextField)`
  color: ${({ theme }) => theme.palette.text.primary};
  input {
    color: ${({ theme }) => theme.palette.text.primary};
  }
  p,
  label {
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;
GitTokenInput.defaultProps = {
  fullWidth: true,
  variant: 'standard',
};

export function GitTokenForm(props: {
  children?: JSX.Element | Array<JSX.Element | undefined | string>;
  storageService: SupportedStorageServices;
}): JSX.Element {
  const { children, storageService } = props;
  const { t } = useTranslation();

  const [onClickLogin] = useAuth(storageService);

  const userInfo = useUserInfoObservable();
  if (userInfo === undefined) {
    return <div>{t('Loading')}</div>;
  }
  return (
    <>
      <AuthingLoginButton onClick={onClickLogin}>{t('AddWorkspace.LogoutToGetStorageServiceToken')}</AuthingLoginButton>
      <GitTokenInput
        helperText={t('AddWorkspace.GitTokenDescription')}
        onChange={(event) => {
          void window.service.auth.set(`${storageService}-token`, event.target.value);
        }}
        value={userInfo[getServiceTokenTypes(storageService)] ?? ''}
      />
      <GitTokenInput
        helperText={t('AddWorkspace.GitUserNameDescription')}
        onChange={(event) => {
          void window.service.auth.set(`${storageService}-userName`, event.target.value);
        }}
        value={userInfo[getServiceUserNameTypes(storageService)] ?? ''}
      />
      <GitTokenInput
        helperText={t('AddWorkspace.GitEmailDescription')}
        onChange={(event) => {
          void window.service.auth.set(`${storageService}-email`, event.target.value);
        }}
        value={userInfo[getServiceEmailTypes(storageService)] ?? ''}
      />
      <GitTokenInput
        helperText={t('AddWorkspace.GitDefaultBranchDescription')}
        onChange={(event) => {
          void window.service.auth.set(`${storageService}-branch`, event.target.value);
        }}
        value={userInfo[getServiceBranchTypes(storageService)] ?? ''}
      />
      {children}
    </>
  );
}
