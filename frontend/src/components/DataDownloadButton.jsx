import React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { downloadMoleculeData } from '../common/MoleculeUtils';

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
  },
}));

export default function DropDownButton({ molecule_ids, dataTypes }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const dataTypeMapping = {
    "ML Data": "ml",
    "DFT Data": "dft",
    "xTB Data": "xtb",
    "xTB_Ni Data": "xtb_ni"
};

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (dataType) => {
    console.log(`${dataTypeMapping[dataType]} data requested`);
    downloadMoleculeData(molecule_ids, dataTypeMapping[dataType])
    handleClose(); // Close the menu
  };

  return (
    <div>
        <Button
            aria-controls={open ? 'customized-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            variant="contained"
            disableElevation
            onClick={handleClick}
            sx={{ my: 3, ml: 2 }}
            endIcon={<KeyboardArrowDownIcon />}
        >
            <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
            Download Search Results
            </span>
        </Button>
    
      <StyledMenu
        id="customized-menu"
        MenuListProps={{
          'aria-labelledby': 'customized-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {dataTypes.map((dataType, index) => (
          <MenuItem key={index} onClick={() => handleMenuItemClick(dataType)} disableRipple>
            {dataType}
          </MenuItem>
        ))}
      </StyledMenu>
    </div>
  );
}
