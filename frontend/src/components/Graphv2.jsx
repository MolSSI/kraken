import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

import { Container } from "@mui/material";
import { TextField } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';



const Graphv2 = ({ molData, componentArray, type, neighborSearch, containerStyle=null }) => {
        // Set the x and y indices to the first 2 values in the component array.
        const [ xIndex, setXIndex ] = useState(0);
        const [ yIndex, setYIndex ] = useState(1);
        const [ patterns, setPatterns ] = useState({});
        const [ plotData, setPlotData ] = useState([])
        const [showLegend, setShowLegend] = useState(false);

        const symbols = [0, 1, 2, 13, 14, 15, 16, 17, 18];
        // Still need to be genericized
        const axis_dict = {"pca1": "pc1", "pca2": "pc2", "pca3": "pc3", "pca4": "pc4", "umap1": "umap1", "umap2": "umap2"};
        

        useEffect(() => {
            fetch(`/${document.location.pathname.split('/')[1]}/brand/patterns.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    const patterns_data = data[0];
                    if (!patterns_data.hasOwnProperty('default')) {
                        patterns_data['default'] = { color: '#ADD8E6', name: 'default' };
                    } 
                    setPatterns(patterns_data);
                })
                .catch(error => {
                    console.error('Error fetching patterns:', error);
                });
        }, []);

        useEffect(() => {
            // Group data by 'pat'
            const groupedByPat = molData.reduce((acc, mol) => {
                const pat = mol.pat || 'default'; // Use 'default' as a fallback
                if (!acc[pat]) {
                    acc[pat] = [];
                }
                acc[pat].push(mol);
                return acc;
            }, {});
        
            // Create a trace for each 'pat'
            const newPlotData = Object.entries(groupedByPat).map(([pat, molArray], index) => {
                return {
                    x: molArray.map(mol => mol.components[xIndex]),
                    y: molArray.map(mol => mol.components[yIndex]),
                    text: molArray.map(mol => encodeURIComponent(mol.smiles) + "," + mol.molecule_id),
                    hovertemplate: "( %{x}, %{y})",
                    hovermode: "closest",
                    mode: 'markers',
                    type: 'scatter',
                    marker: {
                        size: 10,
                        opacity: 0.75,
                        color: patterns[pat]?.color || patterns['default']?.color,
                    },
                    name: patterns[pat]?.name || pat,
                };
            });
        
            setPlotData(newPlotData);
            setShowLegend(newPlotData.length > 1);
        }, [molData, patterns, xIndex, yIndex]);

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

        return (
            <Container sx={containerStyle}>
                <Plot
                    onClick={(event) => moleculePage(event)}
                    onHover={ (event) => showSVG(event) }
                    onUnhover={ (event)=> hideSVG(event) }
                    style={{'width': '100%', 'height': '100%' }}
                    useResizeHandler={true}
                    data={plotData}
                    layout={ {
                        autosize: true,
                        useResizeHandler: true,
                        showlegend: showLegend,
                        style: {width: '100%', height: '100%'},
                        xaxis: {
                        title: {
                            text: 'umap1',
                            font: {
                            size: 18,
                            color: '#7f7f7f'
                            }
                        }
                    },

                        yaxis: {
                            title: {
                            text: 'umap2',
                            font: {
                                size: 18,
                                color: '#7f7f7f'
                            }
                        }
                    }
                    } }
                />
            </Container>
        );
    };

export default Graphv2;