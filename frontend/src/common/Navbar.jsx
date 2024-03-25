import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { NavLink, useLocation } from 'react-router-dom';

import { Link } from 'react-router-dom';

const drawerWidth = 240;
const Badge = ({display}) => {
  const displayStyle = {
    display: display,
    mr: 1,
    fontSize: '60px', 
    maxHeight: '70px',
  };

  return (
    <Box component="img" src={`/${document.location.pathname.split('/')[1]}/brand/logo.svg`} sx={displayStyle} alt="logo" />
  );
};

// Adapted from MUI documentation
// Responsive App Bbar with Drawer - https://mui.com/material-ui/react-app-bar/#responsive-app-bar-with-drawer
function DrawerAppBar(props) {
  const { navwindow, pages } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [name, setName] = useState("");

   useEffect(() => {
    fetch(`/${document.location.pathname.split('/')[1]}/brand/names.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
          setName(data[0].name);
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
        });
}, []);

  const handleDrawerToggle = () => {
    setMobileOpen(prevState => !prevState);
  };

  const location = useLocation();

  const getButtonStyles = (itemPath) => {
    const isHome = (location.pathname === '/' && itemPath === 'home') || location.pathname === `/${itemPath}`;
    return isHome ? { backgroundColor: '#ed1c2477', color: '#fff' } : { color: '#fff' };
  };
  

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        { name }
      </Typography>
      <Divider />
      <List>
      {Object.keys(pages).map(item => {
        const itemPath = item.replace(" ", "_").toLowerCase();
        return (
          <ListItem key={item} disablePadding>
            <NavLink 
              to={itemPath} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ListItemButton sx={{ textAlign: 'center' }}>
                <ListItemText primary={item} />
              </ListItemButton>
            </NavLink>
          </ListItem>
        );
      })}
      {/*}
      <ListItem key="documentation" disablePadding>
       <Link to={window.location.origin + '/docs'} id="documentation" className="NavbarLink" reloadDocument style={{ textDecoration: 'none' }} >
          <ListItemButton sx={{ textAlign: 'center' }}>
            <ListItemText primary="Documentation" />
          </ListItemButton>
        </Link>
        
      </ListItem>
      */}
    </List>
  </Box>
  );

  const container = navwindow !== undefined ? () => navwindow().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
        <Badge display={{ xs: 'none', md: 'flex' }} />
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            { name }
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {Object.keys(pages).map(item => {
              const itemPath = item.replace(" ", "_").toLowerCase();
              return (
                <NavLink
                  to={itemPath}
                  key={item}
                  style={{ textDecoration: 'none' }}
                >
                  <Button sx={getButtonStyles(itemPath)}>
                    <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>{item}</span>
                  </Button>
                </NavLink>
              );
            })}
            {/*
            <Link to={window.location.origin + '/docs'}  id="documentation" className="NavbarLink" reloadDocument style={{ textDecoration: 'none' }} >
              <Button sx={getButtonStyles('documentation')}>
                <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>Documentation</span>
              </Button>
            </Link>
            */}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
      <Toolbar />
    </Box>
  );
}

DrawerAppBar.propTypes = {
  window: PropTypes.func, 
};

export default DrawerAppBar;