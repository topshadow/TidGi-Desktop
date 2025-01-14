import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Divider, List } from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import type { ISectionProps } from '../useSections';
import { Paper, SectionTitle, ListItem, ListItemText } from '../PreferenceComponents';

import webcatalogLogo from '@/images/webcatalog-logo.svg';
import translatiumLogo from '@/images/translatium-logo.svg';

const Logo = styled.img`
  height: 28px;
`;

export function FriendLinks(props: ISectionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <SectionTitle ref={props.sections.friendLinks.ref}>{t('Preference.FriendLinks')}</SectionTitle>
      <Paper elevation={0}>
        <List dense disablePadding>
          <ListItem button onClick={async () => await window.service.native.open('https://github.com/webcatalog/webcatalog-engine')}>
            <ListItemText secondary={t('Preference.WebCatalogEngineIntro')} />
            <ChevronRightIcon color="action" />
          </ListItem>
          <Divider />
          <ListItem button onClick={async () => await window.service.native.open('https://webcatalogapp.com?utm_source=tidgi_app')}>
            <ListItemText primary={<Logo src={webcatalogLogo} alt={t('Preference.WebCatalog')} />} secondary={t('Preference.WebCatalogIntro')} />
            <ChevronRightIcon color="action" />
          </ListItem>
          <Divider />
          <ListItem button onClick={async () => await window.service.native.open('https://translatiumapp.com?utm_source=tidgi_app')}>
            <ListItemText primary={<Logo src={translatiumLogo} alt={t('Preference.Translatium')} />} secondary={t('Preference.TranslatiumIntro')} />
            <ChevronRightIcon color="action" />
          </ListItem>
        </List>
      </Paper>
    </>
  );
}
