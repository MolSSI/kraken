import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';

import ResponsiveAppBar from './common/Navbar';
import { AppRoutes } from './common/Routes';
import Footer from './common/Footer';
import { Box } from '@mui/material'

import Home from './pages/Home';


import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: "#393536",
    }
  },

  typography: {
    h2: {
      textAlign: 'center',
      paddingBottom: '3rem',
      paddingTop: '3rem',
    },
  }
});

const Search = lazy(() => import('./pages/SearchHook'));
const NeighborSearch = lazy(() => import('./pages/Neighbors'));
const Library_Details = lazy(() => import('./pages/Library_Details'))

const pages = {
  'Home': <Home />, 
  'Search': <Search />,
  'Neighbors': <NeighborSearch/>, 
  'Library Details': <Library_Details/>,
};

function Content() {
  const location = useLocation();
  return (
    <>
      {location.pathname !== "/" && location.pathname !== "/home" && <ResponsiveAppBar pages={pages} />}
      <Suspense fallback={<div>Loading...</div>}>
        <AppRoutes pages={pages} />
      </Suspense>
    </>
  );
}

function App() {
  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column'}}>
      <ThemeProvider theme={theme}>
        <Router basename={`/${document.location.pathname.split('/')[1]}`}>
            <Content />
        </Router>
      </ThemeProvider>
    </Box>
    <Footer />
    </>
  );
}

export default App;
