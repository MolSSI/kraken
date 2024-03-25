import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Box, IconButton } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';

function IconLink({ IconElement, text, link, isDownload = false }) {
  // Conditionally set props based on whether this is a download link
  const linkAttributes = isDownload ? {
    href: link,
    download: true
  } : {
    to: link
  };

  const LinkComponent = isDownload ? 'a' : Link;

  return (
    <LinkComponent style={{ textDecoration: "none" }} {...linkAttributes}>
      <Box textAlign="center">
        <IconButton color="inherit" size="large">
          {IconElement ? <IconElement sx={{ color: 'white', fontSize: "5vh" }}/> : <SearchIcon sx={{ color: 'white', fontSize: "5vh" }}/>}
        </IconButton>
        <Typography color="white" textAlign="center">
          {text}
        </Typography>
      </Box>
    </LinkComponent>
  );
}

export default IconLink;
