import React, { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

//import { convertStructToString } from 'ketcher-core'
import { ChemicalMimeType } from 'ketcher-core';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import { Editor } from 'ketcher-react';
import "ketcher-react/dist/index.css";

const structServiceProvider = new StandaloneStructServiceProvider();

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function FullScreenDialog({ ketcherCallBack }) {
  const [ open, setOpen ] = React.useState(false);
  const [ ketcher, setKetcher ] = useState();
    
  const handleClickOpen = () => {
      setOpen(true);
  };

  async function handleClose() {
      let smiles = await ketcher.getSmiles().then(result => {return result;});
      let mol = await ketcher.indigo.aromatize(smiles).then(result => {return result;});
      smiles = await ketcher.indigo.convert(mol, {outputFormat: ChemicalMimeType.DaylightSmiles }).then(result => {return result.struct})
      const SMARTS = await ketcher.getSmarts().then(result => {return result;});
      ketcherCallBack([smiles, SMARTS]);
      setOpen(false);
  };

  return (
    <div>
        <Button variant="contained" sx={{ mb: 5 }} onClick={handleClickOpen}>
        <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
          Open Molecular Sketcher
        </span>
        </Button>
      <Dialog
        //fullWidth={true}
        fullScreen
        maxWidth={"lg"}
        open={open}
        onClose={handleClose}
        keepMounted
        TransitionComponent={Transition}
      >
         <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
          <Editor
              staticResourcesUrl={process.env.PUBLIC_URL}
              structServiceProvider={structServiceProvider}
              onInit={(ketcher) => {
                  setKetcher(ketcher)
              }}
          />
          <Button sx={{ my: 2 }} onClick={handleClose}>Close Sketcher</Button>
      </Dialog>
    </div>
  );
}