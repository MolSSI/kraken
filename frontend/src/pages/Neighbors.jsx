import React, { useEffect, useState } from 'react';
import { TextField, Typography } from "@mui/material";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams } from "react-router-dom";

import Button from '@mui/material/Button';

import DropDownButton from '../components/DataDownloadButton';

import Graph from '../components/Graph'

import { retrieveAllSVGs, dynamicGrid, extractIdsFromResults } from '../common/MoleculeUtils';

async function fetchInitialMoleculeId() {
  const response = await fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/first_id`);
  if (!response.ok) {
      throw new Error('Network response was not ok');
  }
  const result = await response.json();
  const initial_id = result["first_molecule_id"];
  return initial_id;
}


async function NeighborSearch(molecule_id, type="pca", components="1,2,3,4", limit=48, skip=0, signal) {
  /**
   * Requests neighbor data on the molecule from the backend.
   * @param {number} molecule_id Id of the molecule to query.
   * @param {string} type Type of dimensionality reduction. Can be one of PCA or UMAP.
   * @param {string} components String of comma separated integers.
   * @param {number} limit Limit of the search.
   * @param {number} skip How many values to skip.
   * @param {AbortSignal} signal Abortsignal object.
   * @return {json}  The response json.
   */
    let encoded = encodeURIComponent(components);

    const response =  await fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/${molecule_id}/neighbors/?type=${type}&components=${encoded}&skip=${skip}&limit=${limit}`, {signal: signal})

    if (!response.ok) {
        throw new Error('Invalid Molecule Id')
    }

    else {
        return await response.json()
    }
}

export default function NeighborSearchHook () {
    /**
     * React functional component to generate the neighborhood UI.
     * @returns {jsx} The front end JSX that will generate the HTML users will interact with. It contains a search bar as well as generated 
     * a graph, and the dynamic grid component based on what data is available.
     */

    const params = useParams();
    const interval = 15;
    
    const [ moleculeid, setMoleculeID ] = useState();
    const [ skip, setSkip ] = useState(0);
    const [ validMolecule, setValidMolecule ] = useState(true);
    const [ svg_results, setSVGResults ] = useState([])
    const [ searchPage, setSearchPage ] = useState(1);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ isLoadingMore, setIsLoadingMore ] = useState(false);
    const [ molData, setMolData] = useState([]);
    const [ updatedParameters, setUpdatedParameters ] = useState(true);
    const [ searchToggle, setSearchToggle ] = useState(true);
    const [ isMobile, setIsMobile ] = useState(window.innerWidth < 768);
    const [ moleculeIDs, setMoleculeIDs ] = useState("");
    const [ availableDataTypes, setAvailableDataTypes ] = useState([]);

    const reverseMapping = {
      "ml_data": "ML Data",
      "dft_data": "DFT Data",
      "xtb_data": "xTB Data",
      "xtb_ni_data": "xTB_Ni Data"
  };

  useEffect(() => {
    const init = async () => {
        try {
            // Check if there's a molid in the URL params
            if (params.molid) {
                setMoleculeID(params.molid);
            } else {
                // Fetch the initial molecule ID from the endpoint
                const initialId = await fetchInitialMoleculeId();
                setMoleculeID(initialId);
            }
        } catch (error) {
            console.error('Failed to initialize molecule ID:', error);
            // Handle error (e.g., set state to show an error message)
        }
    };

    init();
    }, [params.molid]); // Depend on params.molid so this effect re-runs if the URL parameter changes
  
    useEffect(() => {
      fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/data_types`)
      .then(response => response.json())
      .then(data => {
        const translatedDataTypes = data["available_types"].map(key => reverseMapping[key] || key);
        setAvailableDataTypes(translatedDataTypes);
      });
  }, []);

    // Extract the molecule ids from the results
    useEffect(() => {
      setMoleculeIDs(extractIdsFromResults(svg_results));
    }, [svg_results]);
  

    useEffect(() => {
     function checkMobile() {
       setIsMobile(window.innerWidth < 768);
     }
 
     // Set isMobile at the start in case it's not the initial render
     checkMobile();
 
     window.addEventListener('resize', checkMobile);
 
     // Cleanup the listener when the component is unmounted
     return () => window.removeEventListener('resize', checkMobile);
   }, []); // Empty array means this effect runs once on mount and cleanup on unmount

    function loadMore() {
      /**
       * Loads more neighbors into the UI. 
       */
        setSkip(skip => skip + interval);
        setSearchPage(searchPage => searchPage + 1);
        setIsLoadingMore(true);
        setSearchToggle(!searchToggle)
    }

    function newSearch() {
      /**
       * Searches for new neighbors. Resets alot of the props to their original state.
       */
        setSkip(0);
        setSearchPage(1);
        setSVGResults([]);
        // Just need to toggle this to make sure it toggles
        // so that effect will be triggered
        setIsLoading(true);
        setMolData([]);
        setSearchToggle(!searchToggle);
    }
 
    function loadNeighbors(signal) {
      /**
       * Main driver function which loads the neighbors for a molecule requested by the user.
       * @param {AbortSignal} signal Abortsignal object.
       */
        const fetchData = async () => {
            const molecule_data = await NeighborSearch(moleculeid, "pca", "1,2,3", interval, skip, signal);
            const svg_data = await retrieveAllSVGs(molecule_data, signal);

            return [ molecule_data, svg_data ]
        }

        fetchData()
        .catch( (error) => {
            console.log(error) 
            setValidMolecule(false);
            setSVGResults([])
            setIsLoading(false)
            setIsLoadingMore(false) 
        } )
        .then( (items )=> {

            if (searchPage == 1) {
            setMolData(items[0]);
            setSVGResults(items[1]);
            }

            else {
                setMolData(molData.concat(items[0]));
                setSVGResults(svg_results.concat(items[1]));
            }

            setIsLoading(false);
            setIsLoadingMore(false);
            setValidMolecule(true);

          })
    }

    // If any parameters change, we must set updatedParameters to true.
    useEffect(() => {
      setUpdatedParameters(true);
    }, [moleculeid])

    function _handleKeyDown(event) {
      if (event.key === "Enter") {
        newSearch();
        updateGraphComponentProps();
      }
    }

    // initial load of data
    // and load when search changes. 
    useEffect( ( ) => {
      const controller = new AbortController();
      const signal = controller.signal;

      setUpdatedParameters(false);
      loadNeighbors(signal);

      return () => {
        controller.abort();
      }
    },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [ searchToggle, moleculeid ]
    ); 

    return (
        <Container maxWidth="lg">
        <Typography variant="h2" textAlign="center">Neighbor Search</Typography>
        <Box sx={{pb:1}}>
          <Typography textAlign="center">Neighbors are identified by Euclidian distance in 3 principal component space.</Typography>
        </Box>

        <Box display="flex" justifyContent="center" pt={2}>
        <TextField 
                  style = {{width: 350}}
                  sx={{ m: 0.5}}
                  id="search-outline" 
                  label="" 
                  helperText="Enter a molecule ID to search for neighbors."
                  variant="outlined"
                  value= {moleculeid} 
                  onKeyDown = { (e) => _handleKeyDown(e) }
                  onChange = { event => setMoleculeID( event.target.value ) }
                  InputProps={{endAdornment: <Button onClick={ () => {newSearch(); } } >Search</Button>}}
        />
        </Box>
        <Container sx={{justifyContent: 'center', my: 3}}>
            <Box sx={{ display: 'flex' }} justifyContent="center">
            {/* If molecule is not valid and there is no mol data, then state that there are no results for the molecule ID requested*/}
            { !isLoading && !validMolecule && Object.keys(molData).length == 0 && <Typography>No results found for Molecule ID.</Typography> } 
            </Box>
            <Box sx={{ display: 'flex' }} justifyContent="center">
            {/* If molecule is valid and there is svg data, then generate the images of the molecules*/}
            { 
            
            !isLoading && validMolecule && Object.keys(svg_results).length > 0 && 
             <Container> 
              <Box display="flex" justifyContent="center">
                {!isMobile && <Container sx={{ display: 'flex', minHeight: 500, maxHeight: 750, marginBottom: '64px'}}>{ <Graph molData={molData} componentArray={["1", "2", "3", "4"]} type="pca" neighborSearch={true}></Graph> }</Container> }
                </Box>
                <Box display="flex" justifyContent="center">
                {  (isLoading || isLoadingMore) ? <CircularProgress /> :
                  <>
                      <Button disabled={updatedParameters} variant="contained" sx={{ my: 3 }} onClick={ () => loadMore() } >
                        <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                          Load More
                        </span>
                      </Button>
                      <DropDownButton molecule_ids={moleculeIDs} dataTypes={availableDataTypes} />
                  </>
                }
                </Box>
                

                <Container sx={{display: 'flex', justifyContent: 'left', my: 3}}>    
                  <Typography  sx={{ fontStyle: 'italic' }}>Showing {interval + interval * (searchPage-1)} results.</Typography>
                </Container> 
                { dynamicGrid(svg_results)  }
            </Container>  
            
            }
            
            </Box>
            { !isLoading && Object.keys(svg_results).length > 0 && 
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            {isLoadingMore ? (
              <CircularProgress />
            ) : (
              <Button disabled={updatedParameters} variant="contained" sx={{ m: 0.5 }} onClick={ () => loadMore() }>
                <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                  Load More
                </span>
              </Button> 
            )}
          </Box>
          }

        </Container>
        </Container>
    )
}
