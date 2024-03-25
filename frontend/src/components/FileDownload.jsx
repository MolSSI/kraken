import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import DownloadIcon from '@mui/icons-material/Download';
import IconLink from './IconLink';

const CheckFileAndDownloadIcon = () => {
  const [isSpreadsheet, setIsSpreadsheet] = useState(false);

  useEffect(() => {
    
    async function isSpreadsheetEndpoint() {
    const url = `/${document.location.pathname.split('/')[1]}/content/${document.location.pathname.split('/')[1]}_library.xlsx`;
    const response = await fetch(url);
    // Check if the request was successful
    if (!response.ok) {
      console.error('HTTP Error:', response.status);
      return false;
    }
    else {
      return true;
    };

    };

    isSpreadsheetEndpoint().then(result => setIsSpreadsheet(result));
  }, []);

  return (
    <Grid item>
      {isSpreadsheet  && 
        <IconLink IconElement={DownloadIcon} text="Download" isDownload={true} link={`/${document.location.pathname.split('/')[1]}/content/${document.location.pathname.split('/')[1]}_library.xlsx`}></IconLink>}
    </Grid>
  );
};

export default CheckFileAndDownloadIcon;
