import styled from 'styled-components';
import { Paper, Button, TextField, InputLabel, Select, Autocomplete } from '@material-ui/core';

export const CreateContainer = styled(Paper)`
  padding-top: 20px;
`;
export const LocationPickerContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
`;
export const LocationPickerInput = styled(TextField)``;
LocationPickerInput.defaultProps = {
  fullWidth: true,
  variant: 'standard',
};
export const LocationPickerButton = styled(Button)`
  white-space: nowrap;
  width: fit-content;
  color: 'secondary';
`;
LocationPickerButton.defaultProps = {
  variant: 'contained',
  color: 'primary',
};
export const SoftLinkToMainWikiSelect = styled(LocationPickerInput)`
  width: 100%;
`;
SoftLinkToMainWikiSelect.defaultProps = { select: true };
export const SubWikiTagAutoComplete = styled(Autocomplete)``;
SubWikiTagAutoComplete.defaultProps = {
  freeSolo: true,
};
