import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

import { Container } from "@mui/material";
import { TextField } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';


export default function Graph({ molData, componentArray, type, neighborSearch, containerStyle=null }){
    // Set the x and y indices to the first 2 values in the component array.
    const [ xIndex, setXIndex ] = useState(0);
    const [ yIndex, setYIndex ] = useState(1);

    const symbols = [0, 1, 2, 13, 14, 15, 16, 17, 18];
    // Still need to be genericized
    const axis_dict = {"pca1": "pc1", "pca2": "pc2", "pca3": "pc3", "pca4": "pc4", "umap1": "umap1", "umap2": "umap2"};
    const pattern_dict = {"pc3": "P[C]<sub>3</sub>", 
                        "pn3": "P[N]<sub>3</sub>", 
                        "po3": "P[O]<sub>3</sub>", 
                        "pcn": "P[C]<sub>n</sub>[N]<sub>m</sub>", 
                        "phal": "PF<sub>n</sub>[R]<sub>m</sub>", 
                        "pon": "P[O]<sub>n</sub>[N]<sub>m</sub>", 
                        "pco": "P[C]<sub>n</sub>[O]<sub>m</sub>", 
                        "psi": "P[S]<sub>n</sub>[I]<sub>m</sub>", 
                        "other": "other"};

    const colors = ["#a4876e", "#fb7986", "#d792d0", "#0a9dc7", "#a9d04e", "#eded49", "#ffb152", "#b6ddf6", "#b1b1ae"]

    // Plotting functions to show molecules on hover
    function showSVGWindow(svg, event) {
    /**
     * Creates SVG window on the molecule element when hovering of a point on the plotly graph.
     * @param {string} svg Svg of the molecule.
     * @param {event} event Hover event when hovering over a point on the plotly graph.
     */

        // remove in case existing
        if (document.getElementById("molecule")) {
        document.getElementById("molecule").remove()
        }
    
        let mol = document.createElement("g")
        mol.setAttribute("id", "molecule")
        
        let plotly_container = document.getElementsByClassName("plotly")
        mol.innerHTML = svg;
        
        let xpos = event.event.clientX - 160;
        let ypos = event.event.clientY - 160;
    
        plotly_container[0].appendChild(mol);
        mol.style.position = "fixed";
        mol.style.left = `${xpos}px`;
        mol.style.top = `${ypos}px`;
        mol.style.border = "ridge #393536";
        mol.style.borderRadius = "5px";
        mol.style.height = "40mm";
        mol.style.width = "40mm";
    }
    
    function showSVG(event) {
    /**
     * Requests svg data for the molecule you are hovering on.
     * @param {event} event Hover even when hovering over a point on the plotly graph.
     */
        let smiles = event.points[0].text.split(",")[0]; 
        fetch(`/depict/cow/svg?smi=${smiles}&w=40&h=40`).then(response => 
            response.text() ).then( body => showSVGWindow(body, event) );
    }
    
    function hideSVG() {
    /**
     * Removes molecule element which holds its SVG, when you are no longer hovering.
     */
        if (document.getElementById("molecule")) {
            document.getElementById("molecule").remove()
        }
    }
    
    function moleculePage(event) {
        /**
         * Redirects to the molecule page for the molecule when clicking on a point on the graph.
         * @param {event} event event when hovering over a point on the plotly graph.
         */
        // Gets the original url for the window and splits it into its components. The first element will always be http(s):, second will always be empty, third will always be 
        // website name. Need the first and third elements (0, 2) to redirect to the molecule endpoint below. This is so that regardless of which page we are on, we can redirect to the
        // molecule page.
        let og_url = window.location.href.split("/");
        let molecule_id = event.points[0].text.split(",")[1];
        let url = og_url[0] + "//" + og_url[2] + `/${document.location.pathname.split('/')[1]}/molecule/` + molecule_id;
        if (molecule_id !== undefined) {
            window.open(url, "_blank", "noreferrer");
        }
    }
    /**
     * Creates plotly react graph object.
     * The x and y labels are mapped to the axis dictionary to write pc1 instead of pca1.
     */
    let myPlot = <Plot
                    onClick={(event) => moleculePage(event)}
                    onHover={ (event) => showSVG(event) }
                    onUnhover={ (event)=> hideSVG(event) }
                    style={{'width': '100%', 'height': '100%' }}
                    useResizeHandler={true}
                    // Empty data to fill in later
                    data={[]}
                    layout={ {
                        autosize: true,
                        useResizeHandler: true,
                        showlegend: true,
                        style: {width: '100%', height: '100%'},
                        xaxis: {
                        title: {
                            text: axis_dict[type + componentArray[xIndex]],
                            font: {
                            size: 18,
                            color: '#7f7f7f'
                            }
                        }
                    },

                        yaxis: {
                            title: {
                            text: axis_dict[type + componentArray[yIndex]],
                            font: {
                                size: 18,
                                color: '#7f7f7f'
                            }
                        }
                    }
                    } }
                />
    
    let values;
    
    // If we are plotting a neighbor search, we need to add the target to the data of the plot.
    if (neighborSearch) {

        myPlot.props.data.push(                        
            // Creating the data series for the target of the search using the first element in molData since that is the target
            {
            x: [molData[0].components[xIndex]],
            y: [molData[0].components[yIndex]],
            text: [encodeURIComponent(molData[0].smiles)],
            hovertemplate: "( %{x}, %{y})",
            hovermode: "closest",
            type: 'scatter',
            mode: 'markers',
            marker: {color: 'red', size: 20 , 
                    symbol: "triangle-up",
                    line: {
                        width: 2,
                        color: 'DarkSlateGrey'}},
            name: 'Target'
            });

        // Shifting the data by 1, to avoid overwriting the target of the search if we are plotting a neighbor search.
        values = molData.slice(1);

    }
    else {
        values = molData;
    }
    
    function extractPatterns(molData) {
        let patterns = new Set(molData.filter(obj => obj.hasOwnProperty("pat")).map(obj => obj["pat"]));
        // Convert set to array and sort it.
        let pattern_array = Array.from(patterns).sort();
        return pattern_array;
    }

    let pats = extractPatterns(molData);
    // Fill in data for the graph
    // Loop over all the patterns we have to add them as elements to that data props.
    pats.forEach(function(element, index) {
        myPlot.props.data.push(                        
            // Creating the data series for each pattern
            {
                x: values.map( row => {if (row.pat == element) { return row.components[xIndex] } }),
                y: values.map( row => {if (row.pat == element) { return row.components[yIndex] } }),
                // The text parameter now 
                text: values.map( row => { return encodeURIComponent(row.smiles) + "," + row.molecule_id }),
                hovertemplate: "( %{x}, %{y})",
                hovermode: "closest",
                type: 'scatter',
                mode: 'markers',
                marker: {size: 10 ,
                        opacity: 0.75,
                         color: colors[index],
                        // Randomly assigning symbols from the designated ones above
                        // This causes the symbols to change on data load, which is not bueno.
                        symbol: symbols[index % symbols.length],
                        line: {
                            width: 0.5,
                            color: 'DarkSlateGrey'}},
                name: pattern_dict[element],
            });
        }
    );

    // Need a use effect here, to reset the indices for xIndex and yIndex when new components are passed.
    useEffect( ( ) => {
        setXIndex(0);
        setYIndex(1);
      },
        [ componentArray ]
      );

    return (
        <Container sx={containerStyle ? containerStyle : {}}>
            <Container sx={{display: 'flex', flexDirection: "row", justifyContent: 'center'}}>
            {type === 'pca' ? (
            <>
                <TextField
                id="dimension-outline-x"
                value={xIndex}
                label="x-axis"
                select
                style={{width: 250}}
                sx={{ m: 0.5 }}
                onChange={ function(event) {setXIndex(parseInt(event.target.value));}}
                >
                {componentArray.map((item, index) => (
                    <MenuItem key={index} value={index}>{axis_dict[type + item]}</MenuItem>
                ))}
                </TextField>
                <TextField
                id="dimension-outline-y"
                value={yIndex}
                label="y-axis"
                select
                style={{width: 250}}
                sx={{ m: 0.5 }}
                onChange={ function(event) {setYIndex(parseInt(event.target.value));}}
                >
                {componentArray.map((item, index) => (
                    <MenuItem key={index} value={index}>{axis_dict[type + item]}</MenuItem>
                ))}
                </TextField>
            </>
            ) : null}
      </Container>
            {myPlot}
      </Container>);
}