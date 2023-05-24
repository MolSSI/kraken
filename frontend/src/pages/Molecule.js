import Graph from "../components/Graph"
import React, { useEffect, useState } from 'react';
import { Container } from "@mui/material";
import { retrieveSVG } from "../common/MoleculeUtils";

export default function MoleculeInfo() {
   const [ molData, setMolData ] = useState([]);
   const [ components, setComponents ] = useState(["1", "2"]);
   const [ type, setType ] = useState("umap");
   const [ svg, setSvg ] = useState({});

   async function dimensionality(molecule_id, type, components, signal, limit=10) {
      /**
       * Requests general umap or pca data from the backend.
       * @param {string} type Type of dimensionality reduction. Can be one of PCA or UMAP.
       * @param {string} components String of comma separated integers.
       * @param {AbortSignal} signal Abortsignal object.
       * @param {number} limit Limit of the search.
       * @return {json}  The response json.
       */
         let encoded = encodeURIComponent(components);

         const response =  await fetch(`/api/molecules/${molecule_id}/neighbors/?type=${type}&components=${encoded}&skip=0&limit=${limit}`, {signal: signal})
      
         if (!response.ok) {
            throw new Error('Invalid Molecule Id')
         }
      
         else {
            return await response.json()
         }
   }

   function loadData(signal) {
      /**
       * Main driver function which loads the neighbors for a molecule requested by the user.
       * @param {AbortSignal} signal Abortsignal object.
       */
         const fetchData = async () => {
            const molecule_data = await dimensionality(1, type, components, signal);
            const svg_data = await retrieveSVG(molecule_data[0].smiles, signal);
            return [ molecule_data, svg_data ]
         }

         fetchData()
         .catch( (error) => {
            console.log(error);
         })
         .then( (items )=> {
            setMolData(items[0]);
            setSvg(items[1]);
      })
      }
   
      // initial load of data
      // and load when search changes. 
      useEffect( ( ) => {
         const controller = new AbortController();
         const signal = controller.signal;

         // setUpdatedParameters(false);
         loadData(signal);

         return () => {
         controller.abort();
         }
      },
         // eslint-disable-next-line react-hooks/exhaustive-deps
         [ type ]
      );

   return (
      <Container maxWidth="xl" sx={{display: 'flex', flexDirection: "column", height: 850, alignItems: 'center'}}>
         {Object.keys(svg).length > 0 && <img alt='' src={`data:image/svg+xml;utf8,${encodeURIComponent(svg.svg)}`} />}
         {Object.keys(molData).length > 0 && <Graph molData={molData} componentArray={components} type={type} neighborSearch={true}></Graph>}
      </Container>
   )
}
