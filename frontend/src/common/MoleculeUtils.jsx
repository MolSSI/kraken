import React from 'react';
import { styled } from '@mui/material/styles';
import { Typography } from "@mui/material";
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

async function substructureSearch(substructure, limit=48, skip=0, signal) {
    let encoded = encodeURIComponent(substructure);
    
    const response =  await fetch(`/api/${document.location.pathname.split('/')[1]}/molecules/search/?substructure=${encoded}&skip=${skip}&limit=${limit}`, {signal: signal})

    if (!response.ok) {
        throw new Error('Invalid SMILES')
    }

    else {
        return await response.json()
    }
}

function moleculePage(molecule_id) {
  /**
   * Redirects to the molecule page for the molecule on click.
   * @param {molecule_id} number molecule id for the molecule.
   */
  // Gets the original url for the window and splits it into its components. The first element will always be http(s):, second will always be empty, third will always be 
  // website name. Need the first and third elements (0, 2) to redirect to the molecule endpoint below. This is so that regardless of which page we are on, we can redirect to the
  // molecule page.
  let og_url = window.location.href.split("/");
  let url = og_url[0] + "//" + og_url[2] + `/${document.location.pathname.split('/')[1]}/molecule/` + molecule_id;
  window.open(url, "_blank", "noreferrer");
}

function neighborPage(molecule_id) {
  /**
   * Redirects to the molecule page for the molecule neighbor search on click.
   * @param {molecule_id} number molecule id for the molecule.
   */
  // Gets the original url for the window and splits it into its components. The first element will always be http(s):, second will always be empty, third will always be 
  // website name. Need the first and third elements (0, 2) to redirect to the neighboar endpoint below. 
  let og_url = window.location.href.split("/");
  let url = og_url[0] + "//" + og_url[2] + `/${document.location.pathname.split('/')[1]}/neighbors/` + molecule_id;
  window.open(url, "_blank", "noreferrer");
}


function dynamicGrid( svgs ) {
    /**
     * Generates a Grid filled with the svgs for the molecules.
     * @param {json} svgs Json containing the svg, smiles, and distance for each neighbor.
     * @return {jsx} The front end JSX that will generate the HTML users will interact with. It is a grid of items (described above) filled with the 
     * svg, smiles and distance of the molecule.
     */
    return (
        <Container>
        <Grid container spacing={2} sx= {{ mt: 6 }}>
        {
        svgs.map((result) => (
        <Grid item xs={12} md={4}>
            {result.distance == 0 ? 
            // True condition - render Item with border if distance is 0.
            <Item sx={{border: 3, borderColor: '#ed1c24'}}>
            <img alt='' src={`data:image/svg+xml;utf8,${encodeURIComponent(result.svg)}`} />
            <Typography sx={{ wordBreak: "break-word" }}> <strong>SMILES: </strong> { result.smiles }</Typography>
            <Button variant="contained" sx={{ m: 0.5 }} onClick={() => moleculePage(result.molecule_id)}>
              <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                View Details
              </span>
            </Button>
            </Item>
            // False condition - render Item without border if distance is not 0.
            :
            <Item>
            <img alt='' src={`data:image/svg+xml;utf8,${encodeURIComponent(result.svg)}`} />
            <Typography sx={{ wordBreak: "break-word" }}> <strong>SMILES: </strong> { result.smiles }</Typography>
            
            {result.distance !== undefined && (
                <Typography sx={{ wordBreak: "break-word" }}>
                  <strong>Distance: </strong> {result.distance.toFixed(2)}
                </Typography>
              )}
            <Button variant="contained" sx={{ m: 0.5 }} onClick={() => moleculePage(result.molecule_id)}>
              <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                View Details
              </span>
            </Button>
            <Button variant="contained" sx={{ m: 0.5 }} onClick={() => neighborPage(result.molecule_id)}>
            <span style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                View Neighbors
            </span>
            </Button>
            </Item>} 
        </Grid>
        ))
        }
        
    </Grid>
    </Container>
    )
  }


async function retrieveSVG(smiles, molecule_id, substructure = undefined, distance = undefined, signal) {
    /**
     * Retrieve SVG representation of a molecule.
     *
     * @param {string} smiles - SMILES representation of the molecule.
     * @param {string} molecule_id - molecule_id for the molecule.
     * @param {string} [substructure=undefined] - SMILES representation of the substructure to highlight (optional).
     * @param {number} [distance=undefined] - Distance between the molecule and a reference molecule (optional).
     * @param {AbortSignal} [signal] - Signal object for aborting the fetch request (optional).
     * @returns {Promise<Object>} - A Promise that resolves to an object containing the SVG, SMILES, and distance (if provided).
     */
    let encoded = encodeURIComponent(smiles);
    let encodedSub = encodeURIComponent(substructure);
  
    const response = await fetch(`/depict/cow/svg?smi=${encoded}&sma=${encodedSub}`, {signal: signal});
  
    const svg = await response.text();
    let result = {}
    result["svg"] = svg;
    result["smiles"] = smiles;
    result["molecule_id"] = molecule_id;
  
    if (typeof distance !== "undefined") {
      result["distance"] = distance;
    }
  
    return result;
  }
  

  async function retrieveAllSVGs(items, substructure = undefined) {
    /**
   * Retrieve SVGs for a list of molecules.
   *
   * @param {Array<Object>} items - An array of objects containing molecule data, including SMILES and distance (if applicable).
   * @param {string} [substructure=undefined] - SMILES representation of the substructure to highlight in all molecules (optional).
   * @returns {Promise<Array<Object>>} - A Promise that resolves to an array of objects containing SVG, SMILES, and distance for each molecule.
   */
    return await Promise.all(items.map((item) => {
      return retrieveSVG(item.smiles, item.molecule_id, substructure, item.dist);
    }));
  }


const downloadMoleculeData = (moleculeIDs, data_type="ml", context=null) => {
  const a = document.createElement('a');
  let search_string = `/api/${document.location.pathname.split('/')[1]}/molecules/data/export/batch?molecule_ids=${moleculeIDs}&data_type=${data_type}`;

  if (context) {
    search_string += `&context=${context}`;
  }

  a.href = search_string;
  a.download = true; 
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
  
const extractIdsFromResults = (svg_results) => {
  return svg_results.map(result => result.molecule_id).join(',');
}
  


export { retrieveSVG, retrieveAllSVGs, dynamicGrid, substructureSearch, neighborPage, downloadMoleculeData, extractIdsFromResults };